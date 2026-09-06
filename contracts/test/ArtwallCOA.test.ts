import { expect } from "chai";
import { ethers } from "hardhat";

const DOMAIN = { name: "ArtwallCOA", version: "1" };
const TYPES = {
  MintVoucher: [
    { name: "to", type: "address" },
    { name: "uri", type: "string" },
    { name: "royaltyReceiver", type: "address" },
    { name: "royaltyFeeBps", type: "uint96" },
    { name: "nonce", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
};

async function deploy() {
  const [admin, artist, signer, stranger] = await ethers.getSigners();
  const coa = await (await ethers.getContractFactory("ArtwallCOA")).deploy(
    admin.address,
  );
  await coa.grantRole(await coa.SIGNER_ROLE(), signer.address);
  const { chainId } = await ethers.provider.getNetwork();
  const domain = { ...DOMAIN, chainId, verifyingContract: await coa.getAddress() };
  return { coa, admin, artist, signer, stranger, domain };
}

function voucher(to: string, over: Partial<Record<string, unknown>> = {}) {
  return {
    to,
    uri: "ipfs://bafkreigh2akiscaildc",
    royaltyReceiver: to,
    royaltyFeeBps: 500,
    nonce: ethers.hexlify(ethers.randomBytes(32)),
    deadline: Math.floor(Date.now() / 1000) + 3600,
    ...over,
  };
}

describe("ArtwallCOA", () => {
  it("mints by redeeming a platform-signed voucher, with royalties", async () => {
    const { coa, artist, signer, domain } = await deploy();
    const v = voucher(artist.address);
    const sig = await signer.signTypedData(domain, TYPES, v);

    await expect(coa.connect(artist).mintWithVoucher(v, sig)).to.emit(
      coa,
      "CertificateMinted",
    );
    expect(await coa.ownerOf(0)).to.equal(artist.address);
    expect(await coa.tokenURI(0)).to.equal(v.uri);
    const [receiver, amount] = await coa.royaltyInfo(0, 10_000n);
    expect(receiver).to.equal(artist.address);
    expect(amount).to.equal(500n);
  });

  it("rejects a voucher signed by a non-signer", async () => {
    const { coa, artist, stranger, domain } = await deploy();
    const v = voucher(artist.address);
    const sig = await stranger.signTypedData(domain, TYPES, v);
    await expect(
      coa.connect(artist).mintWithVoucher(v, sig),
    ).to.be.revertedWith("bad voucher signature");
  });

  it("rejects a re-used voucher nonce", async () => {
    const { coa, artist, signer, domain } = await deploy();
    const v = voucher(artist.address);
    const sig = await signer.signTypedData(domain, TYPES, v);
    await coa.connect(artist).mintWithVoucher(v, sig);
    await expect(
      coa.connect(artist).mintWithVoucher(v, sig),
    ).to.be.revertedWith("voucher already used");
  });

  it("rejects an expired voucher", async () => {
    const { coa, artist, signer, domain } = await deploy();
    const v = voucher(artist.address, { deadline: 1 });
    const sig = await signer.signTypedData(domain, TYPES, v);
    await expect(
      coa.connect(artist).mintWithVoucher(v, sig),
    ).to.be.revertedWith("voucher expired");
  });

  it("blocks the open mint path — only MINTER_ROLE may call mintTo", async () => {
    const { coa, artist } = await deploy();
    await expect(
      coa
        .connect(artist)
        .mintTo(artist.address, "ipfs://x", artist.address, 500),
    ).to.be.reverted;
  });

  it("pauses minting", async () => {
    const { coa, admin, artist, signer, domain } = await deploy();
    await coa.connect(admin).pause();
    const v = voucher(artist.address);
    const sig = await signer.signTypedData(domain, TYPES, v);
    await expect(coa.connect(artist).mintWithVoucher(v, sig)).to.be.reverted;
  });
});
