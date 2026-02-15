<p align="center">
  <img src="./public/favicon_black.svg" alt="QNTX Chat" width="160" />
</p>

<h2 align="center">QNTX Chat</h2>

<p align="center">
  Permissionless LLM access via HTTP 402 micropayments.
</p>

<p align="center">
  <a href="https://chat.qntx.fun">Live Demo</a>&ensp;·&ensp;
  <a href="https://www.x402.org">x402 Protocol</a>&ensp;·&ensp;
  <a href="https://github.com/qntx">GitHub</a>
</p>

---

## Overview

QNTX Chat is a fully client-side AI chat interface that replaces API keys and subscription plans with per-message USDC micropayments on [Monad](https://monad.xyz). It implements the [x402 payment protocol](https://www.x402.org/) — the HTTP-native payment standard maintained by Coinbase Developer Platform.

**No registration. No backend accounts. No vendor lock-in.**

## Architecture

```text
Client sends prompt
       │
       ▼
Gateway returns HTTP 402 + price envelope
       │
       ▼
SDK signs USDC transfer (EIP-3009)
       │
       ▼
Facilitator verifies & settles on Monad
       │
       ▼
LLM response streams back to client
```

Every interaction follows the same stateless request–payment–response cycle. The client holds no session state; the gateway holds no user credentials.

## Features

| Capability | Detail |
| --- | --- |
| **Multi-model routing** | GPT-4o · GPT-5.2 · Claude · Gemini · Llama · DeepSeek |
| **Image generation** | DALL-E · Flux · Stable Diffusion |
| **Streaming** | Real-time token-by-token output via SSE |
| **Autonomous settlement** | Per-message on-chain USDC transfer — no manual approval |
| **Client-side only** | Zero backend state, zero stored keys |

## Token Economics

The QNTX token ([nad.fun](https://nad.fun)) is wired into the payment loop. Holding QNTX grants **on-chain verified tiered discounts** applied at settlement time:

| Tier | Required Balance | Discount |
| --- | --- | --- |
| Base | 0 | — |
| Bronze | ≥ 1,000 | 5 % |
| Silver | ≥ 10,000 | 10 % |
| Gold | ≥ 100,000 | 20 % |

Discount tiers are read directly from the caller's QNTX balance on Monad — no off-chain lookup, no trust assumptions.

Trading activity on nad.fun generates [creator fees](https://nad-fun.gitbook.io/nad.fun) (30 % of post-graduation LP fees) that flow back to the project.

## x402 Infrastructure

QNTX Chat is the reference frontend for a full open-source x402 payment stack:

| Repository | Description |
| --- | --- |
| [`x402-openai-python`](https://github.com/qntx/x402-openai-python) | Drop-in OpenAI Python SDK with x402 wallet payments |
| [`x402-openai-typescript`](https://github.com/qntx/x402-openai-typescript) | Drop-in OpenAI TypeScript SDK with x402 wallet payments |
| [`r402`](https://github.com/qntx/r402) | Rust SDK for the x402 payment protocol |
| [`facilitator`](https://github.com/qntx/facilitator) | Production settlement server for on-chain verification |

## Roadmap — Machi

[Machi](https://github.com/qntx/machi) is a Web3-native AI agent framework built on the same x402 infrastructure:

| Layer | Repository | Description |
| --- | --- | --- |
| HD Wallets | [`kobe`](https://github.com/qntx/kobe) | Embedded multi-chain wallet derivation (`no_std` Rust) |
| Agent-to-Agent | [`ra2a`](https://github.com/qntx/ra2a) | Rust SDK for the A2A communication protocol |
| On-chain Identity | [`erc8004`](https://github.com/qntx/erc8004) | ERC-8004 Trustless Agents SDK |

The goal: autonomous agents that settle payments, communicate peer-to-peer, and prove identity — entirely on-chain.

## License

BSD 3-Clause — see [LICENSE](LICENSE).
