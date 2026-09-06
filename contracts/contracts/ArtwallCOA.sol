// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";

/// @title Artwall Certificate of Authenticity
/// @notice ERC-721 with IPFS metadata and EIP-2981 per-token royalties.
///         Minting is gated: a certificate can only be minted by redeeming a
///         voucher signed by the platform's SIGNER_ROLE key (the user still
///         pays gas), or directly by a MINTER_ROLE relayer.
contract ArtwallCOA is
    IERC4906,
    ERC721URIStorage,
    ERC2981,
    AccessControl,
    Pausable,
    EIP712
{
    using ECDSA for bytes32;

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 private constant VOUCHER_TYPEHASH =
        keccak256(
            "MintVoucher(address to,string uri,address royaltyReceiver,uint96 royaltyFeeBps,bytes32 nonce,uint256 deadline)"
        );

    uint256 private _nextTokenId;
    mapping(bytes32 => bool) public voucherUsed;

    struct MintVoucher {
        address to;
        string uri;
        address royaltyReceiver;
        uint96 royaltyFeeBps;
        bytes32 nonce;
        uint256 deadline;
    }

    event CertificateMinted(uint256 indexed tokenId, address indexed to, string uri);

    constructor(address admin)
        ERC721("Artwall Certificate of Authenticity", "ARTWALL")
        EIP712("ArtwallCOA", "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SIGNER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice Redeem a platform-signed voucher. Caller pays gas; `voucher.to`
    ///         receives the NFT (normally the same address).
    function mintWithVoucher(MintVoucher calldata voucher, bytes calldata signature)
        external
        whenNotPaused
        returns (uint256 tokenId)
    {
        require(block.timestamp <= voucher.deadline, "voucher expired");
        require(!voucherUsed[voucher.nonce], "voucher already used");

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    VOUCHER_TYPEHASH,
                    voucher.to,
                    keccak256(bytes(voucher.uri)),
                    voucher.royaltyReceiver,
                    voucher.royaltyFeeBps,
                    voucher.nonce,
                    voucher.deadline
                )
            )
        );
        require(hasRole(SIGNER_ROLE, digest.recover(signature)), "bad voucher signature");

        voucherUsed[voucher.nonce] = true;
        tokenId = _mintInternal(
            voucher.to,
            voucher.uri,
            voucher.royaltyReceiver,
            voucher.royaltyFeeBps
        );
    }

    /// @notice Direct mint for a trusted backend relayer / paymaster flow.
    function mintTo(
        address to,
        string calldata uri,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    ) external whenNotPaused onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        tokenId = _mintInternal(to, uri, royaltyReceiver, royaltyFeeBps);
    }

    function _mintInternal(
        address to,
        string memory uri,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    ) internal returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        if (royaltyReceiver != address(0) && royaltyFeeBps > 0) {
            _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeBps);
        }
        emit CertificateMinted(tokenId, to, uri);
    }

    /// @notice Correct metadata after mint (ADMIN only); emits ERC-4906 so
    ///         marketplaces refresh.
    function setTokenURI(uint256 tokenId, string calldata uri)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, uri);
        emit MetadataUpdate(tokenId);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function totalMinted() external view returns (uint256) { return _nextTokenId; }

    // --- required overrides ---

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981, AccessControl, IERC165)
        returns (bool)
    {
        return
            interfaceId == bytes4(0x49064906) || // ERC-4906
            super.supportsInterface(interfaceId);
    }
}
