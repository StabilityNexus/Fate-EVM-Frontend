<!-- Don't delete it -->
<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="https://raw.githubusercontent.com/StabilityNexus/HammerAuctionHouse-WebUI/0744fdc330ae6fe1a295468e1a070b2d02d8344f/public/stability.svg" width="175">
</div>

&nbsp;

<!-- Organization Name -->
<div align="center">

[![Static Badge](https://img.shields.io/badge/Stability_Nexus-228B22?style=for-the-badge&labelColor=FFC517)](https://stability.nexus/)

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
<h1>Tokens recognised by The Stable Order</h1>
</div>

The TokenList repository maintains an official list of tokens recognized and supported by The Stable Order across multiple blockchains.

## Supported Blockchains

Currently, we maintain token lists for the following networks:

- Ethereum (`ethereum-tokens.json`)
- Ethereum Classic (`ethereum-classic-tokens.json`)
- Cardano's Milkomeda (`cardano's-milkomeda-tokens.json`)
- Polygon PoS (`polygon-pos-tokens.json`)
- Binance Smart Chain (`binance-smart-chain-tokens.json`)
- Base(`base-tokens.json`)

Each blockchain-specific list contains verified tokens with the following information:

- Token ID
- Symbol
- Name
- Contract Address
- Token Image/Logo

If you would like us to support other blockchains, please contact us in [Discord](https://discord.gg/YzDKeEfWtS).

## Token Requirements

<!-- TODO -->

---

## Using the Token Lists

Token lists can be accessed using the following URL format:

```
https://raw.githubusercontent.com/StabilityNexus/TokenList/main/<blockchain>-tokens.json
```

Replace `<blockchain>` with the chain name (e.g., ethereum, polygon-pos, ethereum-classic, etc.)

---

## Contributing

### Adding a New Token

To submit a new token to our list, please follow these steps:

1. Fork the repository
2. Create a new branch with the naming convention: `add-token/<blockchain>-<token-symbol>`
   ```bash
   git checkout -b add-token/ethereum-XYZ
   ```

3. Add your token information to the respective chain's JSON file (e.g., `ethereum-tokens.json` for Ethereum tokens). The token should be added in alphabetical order by symbol:
   ```json
   {
     "id": "example-token",
     "symbol": "XYZ",
     "name": "Example Token",
     "contract_address": "0x1234...",
     "image": "https://example.com/token-logo.png"
   }
   ```

4. Push your changes
   ```bash
   git push origin add-token/ethereum-XYZ
   ```

5. Open a Pull Request with a title in the format:
   ```
   Add <TOKEN_NAME> (<TOKEN_SYMBOL>) to <BLOCKCHAIN> list
   ```
   A PR template will automatically be loaded for you to fill in with your token's details.

6. Share your PR in our Discord
   - Join our [Discord server](https://discord.gg/YzDKeEfWtS)
   - Go to the #development channel
   - Share your PR link with a brief description of your token
