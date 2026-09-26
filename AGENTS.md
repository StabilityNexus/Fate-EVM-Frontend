# AGENTS.md

Guidance for AI coding agents working in Fate-EVM-Frontend, the EVM frontend for
Fate Protocol.

## Project Stack

Next.js 15 (App Router), React 19, TypeScript 5, TailwindCSS with shadcn/ui,
wagmi 2 + viem 2. Wallet connection uses `@stability-nexus/walletlink`
(EIP-6963, no WalletConnect relay or projectId). Statically exported.

## Commands

```bash
npm run dev     # dev server on http://localhost:3000
npm run build   # static export to out/ — this is ALSO the type check
npm run lint    # eslint
```

There is no test runner and no standalone `tsc` script. "Verify a change" means
`npm run lint`, `npm run build`, and driving the flow in a browser with a wallet.

**`build` and `dev` share `distDir: "out"`.** After running a build, delete
`out/` and `.next/` before returning to `npm run dev`, or dev crashes on the
export artifacts.

## Architecture Constraints

- `output: "export"` in `next.config.mjs`. There are **no server components
  fetching data and no API routes**. Every contract read and write happens in
  the browser. Anything touching chain data needs `"use client"`.
- **ABIs are hand-maintained TypeScript consts** in `src/utils/abi/`. They are
  not generated from the contracts repo. If a contract's external surface
  changes, edit the const by hand, then `src/utils/addresses.ts` after a
  redeploy.
- **Adding or enabling a chain touches eight places.** Missing one usually fails
  silently; `explorer.ts` is the exception and throws on an unknown chain id.
  - `src/utils/wagmiConfig.ts` — `chains` and `transports`
  - `src/utils/chains/*.ts` — a viem `Chain` definition, for non-standard chains
  - `src/utils/chainConfig.ts` — `getChainConfig(chainId)`
  - `src/utils/rpcTransport.ts` — `DEFAULT_RPC_URLS`
  - `src/utils/supportedChainFeed.ts` — `CHAIN_PRICE_FEED_OPTIONS`; `SUPPORTED_CHAINS` derives from it
  - `src/utils/explorer.ts` — explorer base URLs
  - `src/utils/addresses.ts` — deployed factory addresses
  - `src/data/tokens/*.json` plus its static import and mapping in `src/utils/tokenList.ts`
- **Three numeric scales are in play and must not be conflated.** Base-token
  amounts use the token's own decimals, read on-chain, never assume 18. Oracle
  prices and sentiment ratios are WAD (1e18). Contract fees use
  `DENOMINATOR = 100000`. Check which one a value is in before doing arithmetic.

## Code Style Conventions

- Path alias `@/*` maps to `src/*`.
- Prefer **wagmi + viem**. ethers v6 remains only in `src/lib/prices.ts` and
  `src/lib/vaultUtils.ts`. Extend the viem path; do not add new ethers code.
- For batched reads outside React, use
  `createPublicClient({ transport: http(), batch: { multicall: true } })`.
- Reuse the shadcn/ui primitives in `src/components/ui` rather than adding new
  component libraries.
- Log through `src/lib/logger.ts` and handle errors through
  `src/lib/errorHandler.ts`. Do not use raw `console.*`.
- Access IndexedDB through the `useIndexedDB` hook. `src/lib/fatePoolHook.ts` is
  a legacy compatibility wrapper; do not build on it. Schema changes require
  bumping `DATABASE_CONFIG.version` in `src/lib/indexeddb/config.ts`.

## Boundaries

- Never commit `.env.local` or any secret. No project IDs or API keys are
  required to run the app.
- Never edit `node_modules/`, `.next/`, or `out/`.
- Do not modify `next.config.mjs`, `tsconfig.json`, or `package.json` unless
  explicitly asked. The webpack `resolve.fallback` and `alias` entries there stub
  out `fs`, `net`, `tls` and React Native async-storage, and the static export
  breaks without them.
- Do not introduce a server-side data path. The app must remain statically
  exportable.
- Brand assets exist twice on purpose: `brand/` is the canonical kit and `public/`
  is what the app serves. Changing one means changing both. Do not delete the
  `public/` copies; `Navbar.tsx` imports `public/logo.svg` directly, and
  `manifest.json` and `layout.tsx` reference the icons by path.

## Git Workflow

- Branch from `main` with a `feat/`, `fix/`, `docs/` or `chore/` prefix.
- One pull request per concern.
- Commit subjects: imperative, roughly 50 characters, capitalized, no trailing
  period. One line, no body.
- Pull requests go against `main` on the upstream repository, from a fork.
