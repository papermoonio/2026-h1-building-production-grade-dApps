const { ethers } = require("hardhat");

async function main() {
  const accounts = await ethers.getSigners();
  console.log("Available accounts:");
  for (let i = 0; i < accounts.length; i++) {
    console.log(`${i}: ${await accounts[i].getAddress()} - Balance: ${(await accounts[i].provider.getBalance(await accounts[i].getAddress())).toString()}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });