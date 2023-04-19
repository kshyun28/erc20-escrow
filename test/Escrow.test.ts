import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('ERC20 Escrow Contract', () => {
  async function deployEscrowFixture() {
    const [owner, customer, merchant, withdrawalWallet] =
      await ethers.getSigners();
    // Escrow
    const Escrow = await ethers.getContractFactory('Escrow');
    const escrowFee = 2;
    const escrowContract = await Escrow.deploy(escrowFee);
    await escrowContract.deployed();
    // Test ERC20 Token
    const TestToken = await ethers.getContractFactory('TestToken');
    const testToken = await TestToken.deploy();
    await testToken.deployed();
    const toWei = ethers.utils.parseEther;
    await testToken.transfer(customer.address, toWei('1'));

    return {
      escrowContract,
      escrowFee,
      owner,
      customer,
      merchant,
      withdrawalWallet,
      testToken,
    };
  }

    describe('Deployment', () => {
      it('Should set the right owner', async () => {
        const { escrowContract, owner } = await loadFixture(deployEscrowFixture);
        expect(await escrowContract.owner()).to.equal(owner.address);
      });

      it('Should assign the correct escrow fee', async () => {
        const { escrowContract, escrowFee } = await loadFixture(
          deployEscrowFixture
        );
        expect(await escrowContract.escrowFee()).to.equal(escrowFee);
      });
    });

  describe('Transactions', () => {
    describe('deposit()', () => {
      it('Should deposit ERC20 from customer', async () => {
        const { escrowContract, testToken, customer } = await loadFixture(
          deployEscrowFixture
        );

        const toWei = ethers.utils.parseEther;
        const tokenAmount = toWei('1');
        await testToken
          .connect(customer)
          .approve(escrowContract.address, tokenAmount);
        await escrowContract.deposit(
          customer.address,
          testToken.address,
          tokenAmount
        );

        expect(
          await escrowContract.escrowBalance(customer.address, testToken.address)
        ).to.equal(toWei('1'));
      });
    });

    describe('withdraw()', () => {
      it('Should withdraw ERC20 to specified address', async () => {
        const { escrowContract, testToken, customer, merchant } =
          await loadFixture(deployEscrowFixture);

        const toWei = ethers.utils.parseEther;
        const tokenAmount = toWei('1');
        await testToken
          .connect(customer)
          .approve(escrowContract.address, tokenAmount);
        await escrowContract.deposit(
          customer.address,
          testToken.address,
          tokenAmount
        );
        await escrowContract.withdraw(
          customer.address,
          merchant.address,
          testToken.address
        );

        expect(
          await escrowContract.escrowBalance(customer.address, testToken.address)
        ).to.equal(toWei('0'));
        expect(await testToken.balanceOf(merchant.address)).to.equal(
          toWei('0.98')
        );
      });

      it('Should accumulate ERC20 fees in escrow commission balance', async () => {
        const { escrowContract, testToken, customer, merchant } =
          await loadFixture(deployEscrowFixture);

        const toWei = ethers.utils.parseEther;
        // First transaction
        const tokenAmount = toWei('0.5');
        await testToken
          .connect(customer)
          .approve(escrowContract.address, tokenAmount);
        await escrowContract.deposit(
          customer.address,
          testToken.address,
          tokenAmount
        );
        await escrowContract.withdraw(
          customer.address,
          merchant.address,
          testToken.address
        );

        // Second transaction
        const tokenAmount2 = toWei('0.5');
        await testToken
          .connect(customer)
          .approve(escrowContract.address, tokenAmount);
        await escrowContract.deposit(
          customer.address,
          testToken.address,
          tokenAmount2
        );
        await escrowContract.withdraw(
          customer.address,
          merchant.address,
          testToken.address
        );

        expect(
          await escrowContract.escrowBalance(customer.address, testToken.address)
        ).to.equal(toWei('0'));
        expect(
          await escrowContract.escrowCommissionBalance(testToken.address)
        ).to.equal(toWei('0.02'));
        expect(await testToken.balanceOf(merchant.address)).to.equal(
          toWei('0.98')
        );
        
      });
    });

    describe('withdrawFees()', () => {
      it('Should withdraw ERC20 fees to specified address', async () => {
        const { escrowContract, testToken, customer, merchant, withdrawalWallet } =
          await loadFixture(deployEscrowFixture);

        const toWei = ethers.utils.parseEther;
        const tokenAmount = toWei('1');
        await testToken
          .connect(customer)
          .approve(escrowContract.address, tokenAmount);
        await escrowContract.deposit(
          customer.address,
          testToken.address,
          tokenAmount
        );
        await escrowContract.withdraw(
          customer.address,
          merchant.address,
          testToken.address
        );
        await escrowContract.withdrawFee(
          withdrawalWallet.address,
          testToken.address
        );

        expect(
          await escrowContract.escrowBalance(customer.address, testToken.address)
        ).to.equal(toWei('0'));
        expect(
          await escrowContract.escrowCommissionBalance(testToken.address)
        ).to.equal(toWei('0'));
        expect(await testToken.balanceOf(withdrawalWallet.address)).to.equal(
          toWei('0.02')
        );
      });
    });
    
    describe('refund()', () => {
      it('Should refund ERC20 to customer', async () => {
        const { escrowContract, testToken, customer } =
          await loadFixture(deployEscrowFixture);

        const toWei = ethers.utils.parseEther;
        const tokenAmount = toWei('1');
        await testToken
          .connect(customer)
          .approve(escrowContract.address, tokenAmount);
        await escrowContract.deposit(
          customer.address,
          testToken.address,
          tokenAmount
        );
        await escrowContract.refund(
          customer.address,
          testToken.address
        );

        expect(
          await escrowContract.escrowBalance(customer.address, testToken.address)
        ).to.equal(toWei('0'));
        expect(await testToken.balanceOf(customer.address)).to.equal(
          toWei('1')
        );
      });
    });
  });
});
