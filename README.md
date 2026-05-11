# ChamaChain

A decentralised savings platform that digitises the traditional African rotating savings group where members make regular fixed contributions and each member receives the full pool on a rotating basis. 

## How It Works

1. **A member creates a chama**, setting the contribution amount (in USDC), cycle duration, maximum members, and payout rotation order.
2. **Members join**, by connecting their Solana wallet and agreeing to the terms locked in the smart contract.
3. **Each cycle**, every member contributes their fixed amount to the on-chain vault before the deadline.
4. **At the end of the cycle**, the smart contract automatically releases the full vault balance to the designated recipient for that round.
5. **Rotation continues** until every member has received a payout, completing the chama.
6. **Reputation is updated**, on-time contributors gain score, defaults are recorded and visible to future chama invitations.

## Tech Stack

- React 
- TypeScript
- Vite 
- Tailwind CSS
- Solana JSON RPC

## Getting started

### Prerequisites

- Node.js 18+
- A Solana wallet browser extension, [Phantom](https://phantom.app) or [Solflare](https://solflare.com)

### Installation

```bash
git clone https://github.com/SeverinusKado/chamachainapp.git
cd chamachainapp
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and connect your wallet.

### Build

```bash
npm run build
```

