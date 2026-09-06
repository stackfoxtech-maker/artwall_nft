import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const signerAddr = process.env.NEXT_PUBLIC_MINT_SIGNER_ADDRESS;

  console.log("Deployer (admin):", deployer.address);
  console.log("Voucher signer:  ", signerAddr ?? "(none — SIGNER_ROLE stays with admin)");

  const factory = await ethers.getContractFactory("ArtwallCOA");
  const contract = await factory.deploy(deployer.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  if (signerAddr && signerAddr.toLowerCase() !== deployer.address.toLowerCase()) {
    const tx = await contract.grantRole(await contract.SIGNER_ROLE(), signerAddr);
    await tx.wait();
    console.log("Granted SIGNER_ROLE to", signerAddr);
  }

  console.log("\nArtwallCOA deployed to:", address);
  console.log("→ set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=" + address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
