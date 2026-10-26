<!-- Don't delete it -->
<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="public/Animated/logo-animated.gif" width="175">
  <img alt="Fate Protocol" src="public/logo.svg" width="150">
</div>

&nbsp;

<!-- Organization Name -->
<div align="center">

[![Static Badge](https://img.shields.io/badge/Stability_Nexus-FateProtocol-228B22?style=for-the-badge&labelColor=FFC517)](https://evm.fate.stability.nexus/)

</div>

<!-- Organization/Project Social Handles -->
<p align="center">
<!-- Telegram -->
<a href="https://t.me/StabilityNexus">
<img src="https://img.shields.io/badge/Telegram-black?style=flat&logo=telegram&logoColor=white&logoSize=auto&color=24A1DE" alt="Telegram Badge"/></a>
&nbsp;&nbsp;
<!-- X (formerly Twitter) -->
<a href="https://x.com/StabilityNexus">
<img src="https://img.shields.io/twitter/follow/StabilityNexus" alt="X (formerly Twitter) Badge"/></a>
&nbsp;&nbsp;
<!-- Discord -->
<a href="https://discord.gg/YzDKeEfWtS">
<img src="https://img.shields.io/discord/995968619034984528?style=flat&logo=discord&logoColor=white&logoSize=auto&label=Discord&labelColor=5865F2&color=57F287" alt="Discord Badge"/></a>
&nbsp;&nbsp;
<!-- Medium -->
<a href="https://news.stability.nexus/">
  <img src="https://img.shields.io/badge/Medium-black?style=flat&logo=medium&logoColor=black&logoSize=auto&color=white" alt="Medium Badge"></a>
&nbsp;&nbsp;
<!-- LinkedIn -->
<a href="https://linkedin.com/company/stability-nexus">
  <img src="https://img.shields.io/badge/LinkedIn-black?style=flat&logo=LinkedIn&logoColor=white&logoSize=auto&color=0A66C2" alt="LinkedIn Badge"></a>
&nbsp;&nbsp;
<!-- Youtube -->
<a href="https://www.youtube.com/@StabilityNexus">
  <img src="https://img.shields.io/youtube/channel/subscribers/UCZOG4YhFQdlGaLugr_e5BKw?style=flat&logo=youtube&logoColor=white&logoSize=auto&labelColor=FF0000&color=FF0000" alt="Youtube Badge"></a>
</p>

<p align="center">
  <a href="https://scorecard.dev/viewer/?uri=github.com/StabilityNexus/Fate-EVM-Frontend">
    <img src="https://api.scorecard.dev/projects/github.com/StabilityNexus/Fate-EVM-Frontend/badge" alt="OpenSSF Scorecard"/>
  </a>
</p>

---

<div align="center">
<h1>Fate Protocol</h1>
</div>

[Fate Protocol](https://evm.fate.stability.nexus/) is a decentralized, perpetual prediction market that operates continuously without expiration. It replaces traditional order books with a dual-vault system—where users buy and sell **bullCoins** and **bearCoins**—enabling speculation on market trends in a fluid, always-on ecosystem.

Built with cutting-edge Web3 technologies, Fate Protocol delivers high-performance trading experiences with gas-optimized smart contracts and pluggable oracles connected through adapters.

## ✨ Key Features

-  **Perpetual Market**: No expiration dates; users can enter or exit positions at any time
-  **Dual-Vault System**: Separate vaults for bullCoins and bearCoins, eliminating order book complexity
-  **Dynamic Fee Structure**: Fixed fees on transactions automatically balance vault reserves
-  **Rebalance**: Anyone can call `rebalance()` to move reserves between the vaults from the oracle value
-  **Self-Balancing**: Automated fund redistribution between vaults based on market movements
-  **Multi-Chain Ready**: Runs on any EVM chain with a deployment; live on a testnet today
-  **Pluggable Oracles**: Oracle values connect through oracle adapters
-  **Gas-Optimized Contracts**: Efficient smart contract design minimizes transaction costs  

---

## 🎬 Video Tutorials

**1. Protocol Walkthrough:**
[Fate Protocol Walkthrough](https://drive.google.com/file/d/1JHGfxee_9Yb33tlT0_rH85BZTfZGjxck/view?usp=sharing)

**2. Interaction Tutorial:**
[Fate Protocol Interaction Walkthrough](https://drive.google.com/file/d/11tthnlqvWHdJjyYvYsvtZW19fug5N6Pu/view?usp=drive_link)

## Technical Architecture

### Frontend
- **Next.js 15**, statically exported, so the whole app runs in the browser
- **TypeScript** for type safety
- **TailwindCSS** with shadcn/ui components
- **Framer Motion** for animations
- **Recharts** for data visualization

### Blockchain
- **Wagmi v2** for Web3 hooks
- **Viem** for lightweight blockchain calls
- **WalletLink** (`@stability-nexus/walletlink`) for wallet connection via EIP-6963, no relay or projectId
- **TanStack React Query** for data sync

### Smart Contracts
- **Networks**: Testnet today, see [Deployed Contracts](#deployed-contracts)
- **Oracles**: Any `IOracle`, through adapters
- **Gas-Optimized**: Minimal transaction costs
- **Fixed Fees**: Fee rates are set per pool at creation

---

## Performance Features

### Frontend Optimizations
- **Static Export**: No server; every contract read and write runs in the browser
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-built pages for faster loads

### User Experience
- **Skeleton Screens**: Immediate loading feedback
- **Optimistic Updates**: Instant UI updates
- **IndexedDB**: Local storage for offline capability
- **Mobile Optimized**: Responsive touch interactions

---

## Supported Networks

Live on the Sepolia testnet. Any other EVM chain needs a deployment first, listed in
[Deployed Contracts](#deployed-contracts).

---

## Deployed Contracts

The app uses these contracts on Sepolia (`src/utils/addresses.ts`):

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **PredictionPoolFactory** | `0x6935432472c180238703805f9809639439b783b6` | [View](https://sepolia.etherscan.io/address/0x6935432472c180238703805f9809639439b783b6) |
| **ChainlinkAdapterFactory** | `0xe6afb97bab25bb9623246cc18ce624a9821cc2bd` | [View](https://sepolia.etherscan.io/address/0xe6afb97bab25bb9623246cc18ce624a9821cc2bd) |
| **NativeCurrencyHelper** | `0x9198c4332845aba314f164be73a00619abb46606` | [View](https://sepolia.etherscan.io/address/0x9198c4332845aba314f164be73a00619abb46606) |

The full record, with deploy blocks and constructor arguments, is
[Deployments.md](https://github.com/StabilityNexus/Fate-Solidity/blob/main/Deployments.md) in Fate-Solidity.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- MetaMask or any other web3 wallet browser extension

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/StabilityNexus/Fate-EVM-Frontend.git
cd Fate-EVM-Frontend
```

#### 2. Install Dependencies

Using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### 3. Run the Development Server

Start the app locally:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

#### 4. Open your Browser

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Test, lint and build

```bash
npm test        # unit tests (vitest)
npm run lint    # ESLint
npm run build   # static export to out/, also the type check
```

> `npm run build` and `npm run dev` share `distDir: "out"`. After a build, delete `out/` and
> `.next/` before going back to `npm run dev`, or dev will fail on the export artifacts.

---

## Project Structure

```text
src/
├── app/                  # Routes
│   ├── [pool]/            # Pool interactions
│   ├── createPool/        # Pool creation
│   ├── explorePools/      # Pool discovery
│   └── portfolio/         # User portfolio
├── components/             # UI components
│   ├── Explore/          # Pool exploration
│   ├── FatePoolCard/     # Pool cards
│   ├── Forms/            # Form components
│   └── ui/               # Base components
├── lib/                  # Contract Interaction logic
└── utils/                # Utilities & configs
    ├── abi/              # Contract ABIs
    └── chains/           # Chain configs
```

---

## Deployment

### GitHub Pages
1. Push to main branch
2. GitHub Actions auto-deploys
3. Available at GitHub Pages URL

### Manual Build
```bash
npm run build
npx serve out   # serve the static export
```

## Contributing

We welcome contributions of all kinds. See **[CONTRIBUTING.md](CONTRIBUTING.md)**
for development setup, coding style, and the pull request process.

Questions and ideas are welcome in our
[Discord channel](https://discord.com/channels/995968619034984528/1324064370883301386).
If you hit a bug, please open an issue with clear steps to reproduce and any
relevant logs or screenshots.

© 2025 The Stable Order.
