# Message Verifier

This repository is a demonstration of EIP-712, which defines a standard for hashing and signing of typed structured data in Ethereum. This demo showcases how to implement EIP-712 in a web application.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Environment Variables

The `.env` file should contain the following environment variables:

- `NEXT_PUBLIC_NETWORK_ID`: The network ID of the Ethereum network you are using.
- `NEXT_PUBLIC_MESSAGER_CONTRACT_ADDRESS`: The address of the deployed Messager contract.
- `NEXT_PUBLIC_INFURA_API`: Your Infura API key for connecting to the Ethereum network.
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Your Wallet Connect project ID. You can get it from the Wallet Connect dashboard.

## Features

- **Sign Message**: Users can sign a message with their Ethereum account.
- **Verify Message**: Users can verify a signed message by relaying it through the Messager smart contract.
- **Transaction Relay**: Users can relay the signed message on-chain.
