# Contributing to Fate-EVM-Frontend

Thanks for taking the time to contribute. This is the EVM frontend for Fate
Protocol, a decentralized perpetual prediction market.

## Discord Project Channel

Questions, ideas, or help with a first contribution:

- **Fate channel**: https://discord.com/channels/995968619034984528/1324064370883301386

## Development Setup

1. **Fork and clone:**

   ```bash
   git clone https://github.com/<your-username>/Fate-EVM-Frontend.git
   cd Fate-EVM-Frontend
   git remote add upstream https://github.com/StabilityNexus/Fate-EVM-Frontend.git
   ```

2. **Install dependencies** (Node.js 18.18 or later; 20 LTS recommended, matching
   Next.js 15's `^18.18.0 || ^19.8.0 || >= 20.0.0`):

   ```bash
   npm install
   ```

3. **Run the dev server:**

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:3000`.

   No API keys or project IDs are required. RPC endpoints are not required
   either: keyless public defaults per chain live in `src/utils/rpcTransport.ts`.

> `npm run build` and `npm run dev` share `distDir: "out"`. After a build,
> delete `out/` and `.next/` before going back to dev, or dev will fail on the
> export artifacts.

## Verifying a Change

There is no test runner in this repository. Before opening a pull request:

- `npm run lint`
- `npm run build` — this is also the type check; there is no standalone `tsc` script
- Exercise the flow in a browser with a wallet on Sepolia or Ethereum Classic

## Coding Style

- TypeScript throughout. The path alias `@/*` maps to `src/*`.
- The app is a static export, so anything reading chain data runs in the
  browser. Mark those components `"use client"`.
- Prefer **wagmi + viem**. ethers v6 survives only in `src/lib/prices.ts` and
  `src/lib/vaultUtils.ts`; extend the viem path rather than adding new ethers
  code.
- UI is shadcn/ui with Tailwind. Reuse the primitives in `src/components/ui`.
- Log through `src/lib/logger.ts` and handle errors through
  `src/lib/errorHandler.ts` rather than raw `console` calls.
- Base-token amounts use the token's own decimals, read on-chain. Never assume
  18. Oracle prices are WAD (1e18) and contract fees use `DENOMINATOR = 100000`.
  These three scales are distinct, so check which one a value is in before doing
  arithmetic on it.

## Changing Contract Calls

ABIs are hand-maintained TypeScript consts in `src/utils/abi/`, not generated.
If a contract's external surface changes, update the matching const, and update
`src/utils/addresses.ts` after a redeploy.

## Pull Request Process

1. Branch from `main` with a `feat/`, `fix/`, `docs/` or `chore/` prefix.
2. Keep one pull request to one concern.
3. Write commit subjects in the imperative, roughly 50 characters, capitalized,
   with no trailing period.
4. Push to your fork and open a pull request against `main` on the upstream
   repository.
5. Fill in the pull request template, including the AI usage disclosure.
6. CodeRabbit reviews automatically. Address its comments alongside maintainer
   feedback.

## Reporting Issues

Open an issue with a clear description, steps to reproduce, the chain and wallet
you used, and any console output or screenshots.
