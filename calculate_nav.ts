import { InfuraProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { ChainId, Fetcher, Route, Trade, Token, TokenAmount, TradeType } from '@uniswap/sdk';

import { PRIVATE_KEY, INFURA_KEY, POOL_ADDR } from './env_vars';

const provider = new InfuraProvider('mainnet', INFURA_KEY);

const key = Buffer.from(PRIVATE_KEY, 'hex');
const wallet = new Wallet(key, provider);

const IndexPoolABI = require('./abis/IndexPool.json');
const ERC20ABI = require('./abis/ERC20.json');

let indexpool: Contract;
let currentTokenERC20: Contract;

let tokenPrices = new Map<string, number>(
    [["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 27.56], // UNI
     ["0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", 395.97], // AAVE
     ["0xc00e94Cb662C3520282E6f5717214004A7f26888", 449.89], // COMP
     ["0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", 12.28], // SNX
     ["0xD533a949740bb3306d119CC777fa900bA034cd52", 2.12], // CRV
     ["0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", 3700.27]] // MKR
);

async function setup_pool() {
    indexpool = new Contract(POOL_ADDR, IndexPoolABI, wallet);
  }
  
async function setup_erc20(underlying) {
    currentTokenERC20 = new Contract(underlying, ERC20ABI, wallet);
  }

function round2(n) {
    return Math.round(n * 100)/100;
}

//-------------------

const WETH = new Token(ChainId.MAINNET, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18)
const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18)

let WETHinDAI: number = 0;

let tokenInETH: number = 0;
let tokenInDAI: number = 0;

async function establishETHPrice() {
   
    const pair = await Fetcher.fetchPairData(WETH, DAI, provider);
    const buyRoute = new Route([pair], WETH);
    const buyTrade = Trade.exactIn(buyRoute, new TokenAmount(WETH, BigInt(1E18)));
    
    WETHinDAI = Number(buyTrade.executionPrice.toSignificant(6))
    
   // console.log("Current price %d DAI for 1 ETH", WETHinDAI);

}

async function priceAltcoin(address) {
    
    const ALT = new Token(ChainId.MAINNET, address, 18)
    
    const pair = await Fetcher.fetchPairData(ALT, WETH, provider)
    const buyRoute = new Route([pair], ALT);
    const buyTrade = Trade.exactIn(buyRoute, new TokenAmount(ALT, BigInt(1E18)));
    
    tokenInETH = Number(buyTrade.executionPrice.toSignificant(6));
    
    tokenInDAI = tokenInETH * WETHinDAI;

}

//-------------------


async function get_nav() {
    
    console.log("Calculating NAV for pool token %s...", POOL_ADDR);
    
    await establishETHPrice();

    await setup_pool();
    
    const innerTokens = await indexpool.getCurrentTokens();
    const totalPoolSupply = Number(await indexpool.totalSupply()/1e18);
    
    console.log("\nTotal index pool tokens in circulation: %d", totalPoolSupply);
    
    console.log("\nCurrent tokens in index pool: %s\n", innerTokens);
    
    let navSum: number = 0; 
    
    for (let ix in innerTokens) {
        let addr = innerTokens[ix];
        await setup_erc20(addr);
        
        let underlyingPoolBalance = await currentTokenERC20.balanceOf(POOL_ADDR);
        let decimals = Number(await currentTokenERC20.decimals());
        
        let scaledUnderlyingInPool = Number(underlyingPoolBalance) / (10 ** decimals)
        
        let tokensPerIndexPoolToken = scaledUnderlyingInPool / totalPoolSupply;
        
        await priceAltcoin(addr);
        
        let navComponent = tokensPerIndexPoolToken * tokenInDAI;
        console.log("NAV component of %s is $%d", addr, round2(navComponent));
        navSum += navComponent;
    }
    
    console.log("\nCurrent NAV of index pool token: $%d", round2(navSum));
    
    await priceAltcoin(POOL_ADDR);
    console.log("\nCurrent Uniswap V2 price of index pool token: $%d", round2(tokenInDAI));
    
}

get_nav();
