<!-- Don't delete it -->
<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="public/Animated/logo-animated.gif" width="175">
  
</div>

&nbsp;

<!-- Organization Name -->
<div align="center">

[![Static Badge](https://img.shields.io/badge/Stability_Nexus-FateProtocol-228B22?style=for-the-badge&labelColor=FFC517)](https://stability.nexus/protocols)

<!-- Correct deployed url to be added -->

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

---

<div align="center">
<h1>Fate Protocol</h1>
</div>

[Fate Protocol](https://evm.fate.stability.nexus/) is a decentralized, perpetual prediction market that operates continuously without expiration. It replaces traditional order books with a dual-vault system—where users buy and sell **bullCoins** and **bearCoins**—enabling speculation on market trends in a fluid, always-on ecosystem.

Built with cutting-edge Web3 technologies, Fate Protocol delivers high-performance trading experiences with gas-optimized smart contracts and real-time price feeds from multiple oracle providers.

## ✨ Key Features

-  **Perpetual Market**: No expiration dates; users can enter or exit positions at any time
-  **Dual-Vault System**: Separate vaults for bullCoins and bearCoins, eliminating order book complexity
-  **Dynamic Fee Structure**: Fixed fees on transactions automatically balance vault reserves
-  **DistributeOutcome Function**: Community-driven reserve adjustments ensure fairness and transparency
-  **Self-Balancing**: Automated fund redistribution between vaults based on market movements
-  **Multi-Chain Support**: Deployed across Ethereum, Base, BNB Smart Chain, Ethereum Classic, and Polygon
-  **Real-Time Price Feeds**: Integrated Chainlink and Hebeswap oracles for accurate market data
-  **Gas-Optimized Contracts**: Efficient smart contract design minimizes transaction costs  

---

## 🎬 Video Tutorials

**1. Protocol Walkthrough:**
[Fate Protocol Walkthrough](https://drive.google.com/file/d/1JHGfxee_9Yb33tlT0_rH85BZTfZGjxck/view?usp=sharing)

**2. Interaction Tutorial:**
[Fate Protocol Interaction Walkthrough](https://drive.google.com/file/d/11tthnlqvWHdJjyYvYsvtZW19fug5N6Pu/view?usp=drive_link)

## Technical Architecture

### Frontend
- **Next.js 15** with React Server Components
- **TypeScript** for type safety
- **TailwindCSS** with shadcn/ui components
- **Framer Motion** for animations
- **Recharts** for data visualization

### Blockchain
- **Wagmi v2** for Web3 hooks
- **Ethers.js v6** for Ethereum interactions
- **Viem** for lightweight blockchain calls
- **Rainbow-Kit** supporting 10+ wallets
- **TanStack React Query** for data sync

### Smart Contracts
- **Multi-Chain**: Ethereum, Base, BNB Smart Chain, Ethereum Classic and Polygon 
- **Oracles**: Chainlink and Hebeswap price feeds
- **Gas-Optimized**: Minimal transaction costs
- **Audited**: Transparent fee structures

---

## Performance Features

### Frontend Optimizations
- **Server Components**: Reduced client-side JavaScript
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-built pages for faster loads
- **Streaming**: Progressive page loading

### User Experience
- **Skeleton Screens**: Immediate loading feedback
- **Optimistic Updates**: Instant UI updates
- **IndexedDB**: Local storage for offline capability
- **Mobile Optimized**: Responsive touch interactions

---

## Supported Networks

Fate Protocol is deployed across multiple EVM-compatible networks:

- **Base** - Main deployment with optimized gas costs
- **BNB Smart Chain** - High-performance trading environment
- **Ethereum Classic** - Decentralized and secure network
- **Ethereum Mainnet** - Primary Ethereum network
- **Polygon** - Polygon mainnet
- **Sepolia Testnet** - Ethereum testnet for development

---

## Deployed Contracts

### Pool Factory Contracts

| Network | Contract Address | BlockScout | Status |
|---------|------------------|------------|--------|
| **Ethereum Classic** | `0x6eb2eec7bcc4096e35d7bc467e411a505c7db202` | [View](https://blockscout.com/etc/mainnet/address/0x6eb2eec7bcc4096e35d7bc467e411a505c7db202) | ✅ Deployed |
| **Sepolia Testnet** | `0x5fae23ab9c0b36f30bb4c6ab1d7b9c8cdbef8d18` | [View](https://sepolia.etherscan.io/address/0x5fae23ab9c0b36f30bb4c6ab1d7b9c8cdbef8d18) | ✅ Deployed |
| **Base** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |
| **BNB Smart Chain** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |
| **Ethereum Mainnet** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |
| **Polygon** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |

### Oracle Adapter Contracts

| Network | Contract Address | BlockScout | Status |
|---------|------------------|------------|--------|
| **Ethereum Classic** | `0x017cdc5ed9ba47a6a5c4414e8c66e7d7e967a83a` | [View](https://blockscout.com/etc/mainnet/address/0x017cdc5ed9ba47a6a5c4414e8c66e7d7e967a83a) | ✅ Deployed |
| **Sepolia Testnet** | `0x2cbd9e1ec213f5ef2c8f0703514254ff7288723e` | [View](https://sepolia.etherscan.io/address/0x2cbd9e1ec213f5ef2c8f0703514254ff7288723e) | ✅ Deployed |
| **Base** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |
| **BNB Smart Chain** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |
| **Ethereum Mainnet** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |
| **Polygon** | `0x0000000000000000000000000000000000000000` | - | ⏳ Pending |


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

---

## Project Structure

```text
src/
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
npm run start
```

## Contributing

We welcome contributions of all kinds! To contribute:

1. Fork the repository and create your feature branch (`git checkout -b feature/AmazingFeature`).
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
3. Run the development workflow commands to ensure code quality:
   - `npm run lint`
4. Push your branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request for review.

If you encounter bugs, need help, or have feature requests:

- Please open an issue in this repository providing detailed information.
- Describe the problem clearly and include any relevant logs or screenshots.

We appreciate your feedback and contributions!

© 2025 The Stable Order.
