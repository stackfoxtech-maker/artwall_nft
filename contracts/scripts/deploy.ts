import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const factory = await ethers.getContractFactory("ArtwallCOA");
  const contract = await factory.deploy(deployer.address);
  await contract.waitForDeployment();

  console.log("ArtwallCOA deployed to:", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
