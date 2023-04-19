import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-solhint';
import dotenv from 'dotenv';
import 'hardhat-gas-reporter';
import { HardhatUserConfig } from 'hardhat/config';

dotenv.config();

const { ALCHEMY_API_KEY, COINMARKETCAP_API_KEY, PRIVATE_KEY_ESCROW } =
  process.env;

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: process.env.REPORT_GAS == 'true' ? true : false,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: 'USD',
    token: 'BNB',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.18',
      },
    ],
  },
  networks: {
    eth_goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY_ESCROW!],
    },
    bsc_testnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: [PRIVATE_KEY_ESCROW!],
    },
    bsc_mainnet: {
      url: `https://bsc-dataseed.binance.org`,
      accounts: [PRIVATE_KEY_ESCROW!],
    },
  },
};

export default config;
