import { expect } from "chai";
import { ethers } from "hardhat";

describe("ArtwallCOA", () => {
  it("mints a certificate with metadata and royalties", async () => {
    const [owner, artist] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ArtwallCOA");
    const coa = await factory.deploy(owner.address);

    const uri = "ipfs://bafkreigh2akiscaildc";
    await expect(
      coa.mintCertificate(artist.address, uri, artist.address, 500),
    ).to.emit(coa, "CertificateMinted");

    expect(await coa.ownerOf(0)).to.equal(artist.address);
    expect(await coa.tokenURI(0)).to.equal(uri);

    const [receiver, amount] = await coa.royaltyInfo(0, 10_000n);
    expect(receiver).to.equal(artist.address);
    expect(amount).to.equal(500n);
  });
});
