import { TickerRegistryContract, artifacts } from "../src";
import { TestTokenContract } from "./generated-wrappers/test_token";
import * as TestTokenArtifact from "./test-artifacts/TestToken.json";

import Web3ProviderEngine from "web3-provider-engine";
import { ContractArtifact } from "ethereum-types";
import { GanacheSubprovider } from "@0x/subproviders";
import { Web3Wrapper } from "@0x/web3-wrapper";
import { providerUtils, BigNumber } from "@0x/utils";
import * as chai from 'chai';
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

describe("TickerRegistry", () => {
    let web3Wrapper, accounts, tka, tkb, tkc, trc;
    before(async () => {
        const provider = new Web3ProviderEngine();
        provider.addProvider(new GanacheSubprovider({}));
        providerUtils.startProviderEngine(provider);
        web3Wrapper = new Web3Wrapper(provider);
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        const from = accounts[0];
        tka = await TestTokenContract.deployFrom0xArtifactAsync(TestTokenArtifact as ContractArtifact, provider, { from }, { TestToken: TestTokenArtifact as ContractArtifact }, "TokenA", "TKA", 18);
        tkb = await TestTokenContract.deployFrom0xArtifactAsync(TestTokenArtifact as ContractArtifact, provider, { from }, { TestToken: TestTokenArtifact as ContractArtifact }, "TokenB", "TKB", 18);
        tkc = await TestTokenContract.deployFrom0xArtifactAsync(TestTokenArtifact as ContractArtifact, provider, { from }, { TestToken: TestTokenArtifact as ContractArtifact }, "TokenC", "TKC", 18);

        trc = await TickerRegistryContract.deployFrom0xArtifactAsync(artifacts.TickerRegistry, provider, { from }, { TickerRegistry: artifacts.TickerRegistry }, [{ tokenAddress: tkc.address, ticker: "ex" }])
    });

    it('should have initial ticker registered', async () => {
        const tickers = await trc.listTrackedTickers().callAsync();
        tickers.should.include("ex");
        tickers.length.should.eq(1);
    });

    it('should allow anyone to register a ticker', async () => {
        await trc.registerTicker(tka.address).awaitTransactionSuccessAsync({from: accounts[1]});
        const tickers = await trc.listTrackedTickers().callAsync();
        tickers.should.include("TKA");
    });

    it('should not allow an duplicate registration', async () => {
        await trc.registerTicker(tka.address).awaitTransactionSuccessAsync().should.eventually.be.rejected;
    });

    it('should not allow an duplicate registration of an overridden ticker', async () => {
        await trc.registerTicker(tkc.address).awaitTransactionSuccessAsync().should.eventually.be.rejected;
    });

    it('should prevent registration of a used ticker', async () => {
       await trc.overrideTicker("TKB", tka.address).awaitTransactionSuccessAsync();
       await trc.registerTicker(tkb.address).awaitTransactionSuccessAsync().should.eventually.be.rejected;
    });

    it('should prevent anyone from using the override function', async () => {
        await trc.overrideTicker("BKT", tkb.address).awaitTransactionSuccessAsync({ from: accounts[2] }).should.eventually.be.rejected;
    });

    it('should allow override of a used ticker', async () => {
        await trc.addressForTicker('TKB').callAsync().should.eventually.eq(tka.address);
        await trc.overrideTicker("TKB", tkb.address).awaitTransactionSuccessAsync();
        await trc.addressForTicker('TKB').callAsync().should.eventually.eq(tkb.address);
        const tickers = await trc.listTrackedTickers().callAsync();
        tickers.length.should.eq(2);
    });

    it('should allow reintroduction of previously overridden and removed token and ticker', async () => {
        await trc.registerTicker(tka.address).awaitTransactionSuccessAsync();
        const tickers = await trc.listTrackedTickers().callAsync();
        tickers.length.should.eq(3);
        tickers.should.include("TKA");
    });

    it('should allow admin(OWNER) to use the override function', async () => {
        await trc.tickerForAddress(tkb.address).callAsync().should.eventually.eq("TKB");
        await trc.overrideTicker("C", tkb.address).awaitTransactionSuccessAsync();
        const tickers = await trc.listTrackedTickers().callAsync();
        tickers.should.include("C");
        await trc.tickerForAddress(tkb.address).callAsync().should.eventually.eq("C");
    });

    it("should cleanly override a registered ticker", async () => {
        await trc.addressForTicker('ex').callAsync().should.eventually.eq(tkc.address);
        await trc.overrideTicker("tkC", tkc.address).awaitTransactionSuccessAsync();
        const tickers = await trc.listTrackedTickers().callAsync();
        tickers.length.should.eq(3);
        tickers.should.not.include("ex");
        await trc.addressForTicker('ex').callAsync().should.eventually.eq("0x0000000000000000000000000000000000000000")
    });
});