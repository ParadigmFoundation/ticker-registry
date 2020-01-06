# Ticker registry

A **proof-of-concept** public on-chain registry for token tickers with admin override functionality.

It allows any user to register a token address, provided that address has not already been registered, and that there is not already a token registered with that ticker.

It allows an admin to override the provided value for a token ticker, for example, when old DAI was renamed SAI, yet the original SAI contract still shows the ticker as DAI.

See the [`quick_tests.ts`](https://github.com/ParadigmFoundation/ticker-registry/blob/master/test/quick_test.ts) for assertions over the basic functionality.

## Important note

Currently in development, this contract has not been audited and is not intended for use on the Ethereum main-network yet.

## Development

_See [`package.json`](./package.json) for all scripts._

1. Clone
1. Install dependencies (`yarn`)
1. Build (`yarn build`)
   1. Compile contracts (`yarn compile:solidity`)
   1. Compile typescript (`yarn copmile:typescript`)
   1. Generate contract wrappers (`yarn generate:contract_wrappers`)
1. Build test artifacts (`yarn build:test`)
   1. Generate solidity test artifacts (`yarn compile:test:solidity`)
   1. Generate TS test artifacts (`yarn generate:test:contract_wrappers`)
1. Run tests (`yarn test`)

## License

[MIT](./LICENSE)
