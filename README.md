# ndx-calculate-nav

Scripts for determining the NAV of an Indexed Finance pool, along with it's current Uniswap V2 price.

*Last Update: 20 August 2021*

## Current Status

Clone this, add some config variables. Run it.

## Prerequisites

`yarn` (through `npm`: https://classic.yarnpkg.com/en/docs/install)

## Setup

Run `yarn install` in the main directory.

Put these two things in env_vars.ts:

* The `PRIVATE_KEY` (sans leading 0x) for a wallet (any wallet) from,
* The `INFURA_KEY` that allows you read on-chain data from Infura, and
* The `POOL_ADDR` - the checksummed address of the underlying index pool (i.e. DEFI5, DEGEN, CC10).

If you don't have an Infura API key, here's how to get one: https://medium.com/jelly-market/how-to-get-infura-api-key-e7d552dd396f

I advise creating a new wallet and using the private key for that so as to not risk your funds.

## Execution

`ts-node calculate_nav.ts`

That's it. 

## In Action

For the CC10 and DEFI5 respectively:

![image](https://user-images.githubusercontent.com/36096924/130161783-d3cb35ad-1a17-4579-9bf7-913ee9354f21.png)
