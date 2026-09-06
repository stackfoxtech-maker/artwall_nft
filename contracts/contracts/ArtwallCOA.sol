// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Artwall Certificate of Authenticity
/// @notice ERC-721 with per-token metadata (IPFS) and EIP-2981 per-token royalties.
contract ArtwallCOA is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    event CertificateMinted(uint256 indexed tokenId, address indexed to, string uri);

    constructor(address initialOwner)
        ERC721("Artwall Certificate of Authenticity", "ARTWALL")
        Ownable(initialOwner)
    {}

    /// @notice Mint a certificate NFT with metadata and a royalty split.
    /// @param to               recipient of the NFT
    /// @param uri              ipfs:// URI of the ERC-721 metadata JSON
    /// @param royaltyReceiver  address that receives secondary-sale royalties
    /// @param royaltyFeeBps    royalty in basis points (e.g. 500 = 5%)
    function mintCertificate(
        address to,
        string calldata uri,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    ) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        if (royaltyReceiver != address(0) && royaltyFeeBps > 0) {
            _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeBps);
        }
        emit CertificateMinted(tokenId, to, uri);
    }

    // --- required overrides ---

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
