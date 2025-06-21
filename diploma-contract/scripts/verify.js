const { run } = require("hardhat");

async function verify(address) {
  await run("verify:verify", {
    address,
    constructorArguments: [],
  });
}

if (require.main === module) {
  const address = process.argv[2];
  if (!address) {
    console.error("Usage: node verify.js <contract_address>");
    process.exit(1);
  }
  verify(address).catch(console.error);
} 