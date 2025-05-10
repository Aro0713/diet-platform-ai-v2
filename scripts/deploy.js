const hre = require("hardhat");

async function main() {
  const Subscription = await hre.ethers.getContractFactory("ALcoinSubscription");
  const contract = await Subscription.deploy();

  await contract.waitForDeployment(); // <-- zamiast contract.deployed()

  console.log(`ALcoinSubscription deployed to: ${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
