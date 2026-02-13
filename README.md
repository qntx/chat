# QNTX Chat

Pay-per-message AI chat powered by the [x402](https://www.x402.org/) payment protocol. No subscriptions, no API keys — connect your wallet and start chatting.

## How It Works

1. Connect your EVM wallet (MetaMask, Coinbase, Rainbow, etc.)
2. Send a message — the gateway responds with an HTTP 402 payment challenge
3. Sign a USDC micropayment — your message is delivered and the AI responds

Every payment is an on-chain USDC transfer verified by the x402 facilitator. You pay only for what you use.

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.
