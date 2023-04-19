import { ethers } from 'hardhat';

const { ESCROW_FEE } = process.env;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const Escrow = await ethers.getContractFactory('Escrow');
  // deploy with escrow fee
  const escrow = await Escrow.deploy(ESCROW_FEE!);
  await escrow.deployed();

  console.log('Escrow address:', escrow.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
