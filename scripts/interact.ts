import { ethers } from 'hardhat';
import contract from '../../artifacts/contracts/Escrow.sol/Escrow.json';
import { Escrow } from '../../typechain-types';

const {
  ALCHEMY_API_KEY,
  ALCHEMY_NETWORK,
  CONTRACT_ADDRESS,
  PRIVATE_KEY_ESCROW,
  PUBLIC_KEY_ESCROW,
  PRIVATE_KEY_CUSTOMER,
  PUBLIC_KEY_CUSTOMER,
  PRIVATE_KEY_MERCHANT,
  PUBLIC_KEY_MERCHANT,
} = process.env;

const alchemyProvider = new ethers.providers.AlchemyProvider(
  ALCHEMY_NETWORK,
  ALCHEMY_API_KEY
);

// Use baseProvider when not using Alchemy
// const baseProvider = new ethers.providers.JsonRpcProvider(
//   // 'https://bsc-dataseed.binance.org'
//   // 'https://data-seed-prebsc-1-s1.binance.org:8545'
// );
const provider = alchemyProvider;

const signerEscrow = new ethers.Wallet(PRIVATE_KEY_ESCROW!, provider);
const signerCustomer = new ethers.Wallet(PRIVATE_KEY_CUSTOMER!, provider);
const signerMerchant = new ethers.Wallet(PRIVATE_KEY_MERCHANT!, provider);

const fromWei = ethers.utils.formatEther;
const toWei = ethers.utils.parseEther;

const escrowOwner = new ethers.Contract(
  CONTRACT_ADDRESS!,
  contract.abi,
  signerEscrow
) as Escrow;

async function main() {
  const { deposit, withdraw, withdrawFee, refund, escrowBalance, escrowCommissionBalance } = escrowOwner;

  // Escrow admin creates deposit and customer approves crypto transfer
  // Customer approves token transfer
  const tokenAddress = '0x99D572B6B04ae564A9a61239A6dc744A573FFb4D'; // Convert to environment variable
  const tokenAmount = toWei('1');
  const token = await ethers.getContractAt('ERC20', tokenAddress);
  const approveTx = await token.connect(signerCustomer).approve(CONTRACT_ADDRESS!, tokenAmount)
  await approveTx.wait();
  console.log(`Escrow ${await token.symbol()} commission fee balance:`, fromWei(await escrowCommissionBalance(tokenAddress)));

  // Escrow admin deposits customer crypto
  const depositTx = await deposit(PUBLIC_KEY_CUSTOMER!, tokenAddress, tokenAmount);
  const depositReceipt = await depositTx.wait();
  console.log('Escrow Admin deposit:');
  console.log('Transaction hash:', depositReceipt.transactionHash)
  console.log(`Escrow ${await token.symbol()} balance for ${PUBLIC_KEY_CUSTOMER}:`, fromWei(await escrowBalance(PUBLIC_KEY_CUSTOMER!, tokenAddress)));
  console.log(`Escrow ${await token.symbol()} commission fee balance:`, fromWei(await escrowCommissionBalance(tokenAddress)));
  console.log(`Wallet ${await token.symbol()} balance for ${PUBLIC_KEY_CUSTOMER}:`, fromWei(await token.balanceOf(PUBLIC_KEY_CUSTOMER!)));
  console.log()

  // // If refund instead of withdraw, uncomment "refund" and comment out "withdraw" and "withdrawFee"
  // // Escrow admin refunds crypto to customer
  // const refundTx = await refund(PUBLIC_KEY_CUSTOMER!, tokenAddress);
  // const refundReceipt = await refundTx.wait();
  // console.log('Escrow Admin refund:');
  // console.log('Transaction hash:', refundReceipt.transactionHash)
  // console.log(`Escrow ${await token.symbol()} balance for ${PUBLIC_KEY_CUSTOMER}:`, fromWei(await escrowBalance(PUBLIC_KEY_CUSTOMER!, tokenAddress)));
  // console.log(`Wallet ${await token.symbol()} balance for ${PUBLIC_KEY_CUSTOMER}:`, fromWei(await token.balanceOf(PUBLIC_KEY_CUSTOMER!)));
  // console.log()

  // Escrow admin releases crypto to merchant
  const withdrawTx = await withdraw(PUBLIC_KEY_CUSTOMER!, PUBLIC_KEY_MERCHANT!, tokenAddress);
  const withdrawReceipt = await withdrawTx.wait();
  console.log('Escrow Admin withdraw:');
  console.log('Transaction hash:', withdrawReceipt.transactionHash)
  console.log(`Escrow ${await token.symbol()} balance for ${PUBLIC_KEY_CUSTOMER}:`, fromWei(await escrowBalance(PUBLIC_KEY_CUSTOMER!, tokenAddress)));
  console.log(`Escrow ${await token.symbol()} commission fee balance:`, fromWei(await escrowCommissionBalance(tokenAddress)));
  console.log()

  // Escrow admin withdraws crypto fees to wallet
  const withdrawFeeTx = await withdrawFee(PUBLIC_KEY_ESCROW!, tokenAddress);
  const withdrawFeeReceipt = await withdrawFeeTx.wait();
  console.log('Escrow Admin withdraw:');
  console.log('Transaction hash:', withdrawFeeReceipt.transactionHash)
  console.log(`Escrow ${await token.symbol()} commission fee balance:`, fromWei(await escrowCommissionBalance(tokenAddress)));
  console.log(`${await token.symbol()} wallet balance:`, fromWei(await token.balanceOf(PUBLIC_KEY_ESCROW!)));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
