const hre = require("hardhat");

async function main() {
  const DiplomaVerifier = await hre.ethers.getContractFactory("DiplomaVerifier");
  const contract = await DiplomaVerifier.deploy();
  await contract.deployed();
  console.log("DiplomaVerifier deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 