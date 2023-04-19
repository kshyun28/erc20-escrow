# erc20-escrow

Escrow contract for ERC20 tokens derived from [Openzeppelin base escrow contracts](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/escrow/Escrow.sol).

## .env

```
# API keys
ALCHEMY_API_KEY=

# Configs
NETWORK=goerli
CONTRACT_ADDRESS=0x9101aEcD00c74D5de3470194d2081e76E1B0E786
PRIVATE_KEY=
PRIVATE_KEY_USER_A=
PRIVATE_KEY_USER_B=
PUBLIC_KEY_USER_A=
PUBLIC_KEY_USER_B=

# Escrow configs
ESCROW_FEE=1
```

## Commands

- Compile smart contracts
  `yarn compile`

- Run smart contract tests
  `yarn test`

- Deploy smart contract
  `yarn deploy`

- Interact with smart contract using script
  `yarn interact`
