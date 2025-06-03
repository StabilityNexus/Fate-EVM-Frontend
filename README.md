# Fate Protocol

**Fate Protocol** is a decentralized, perpetual prediction market that operates continuously without expiration. It replaces traditional order books with a dual-vault system—where users buy and sell **bullCoins** and **bearCoins**—enabling speculation on market trends in a fluid, always-on ecosystem.

## Key Features

- **Perpetual Market**: No expiration dates; users can enter or exit positions at any time.  
- **Dual-Vault System**: Separate vaults for bullCoins and bearCoins, eliminating the need for an order book.  
- **Dynamic Fee Structure**: A fixed fee on every buy or sell transaction is used to balance the vaults.  
- **DistributeOutcome Function**: Allows anyone to periodically adjust the reserves, ensuring fairness and transparency.  
- **Self-Balancing**: As prices move, the bull vault “drains” the bear vault, and vice versa, keeping the system fluid.  

## How It Works

1. **Buying bullCoins or bearCoins**:  
   - Users can buy bullCoins or bearCoins to speculate on upward or downward price movements.  
   - A fixed fee from buying goes into the corresponding vault (e.g., bullCoin purchases boost the bull vault).  

2. **Selling bullCoins or bearCoins**:  
   - When selling, the fee is transferred to the opposing vault (e.g., selling bullCoins sends fees to the bear vault).  
   - This mechanism ensures continuous rebalancing of funds between the two vaults.  

3. **DistributeOutcome Function**:  
   - Anyone can execute this function to periodically adjust the reserves based on current market conditions.  
   - This helps maintain a fair balance and prevents any single entity from dominating the market.  

4. **Perpetual & Autonomous**:  
   - The protocol runs indefinitely, without expiration dates on markets.  
   - It relies on transparent smart contracts, removing the need for centralized intermediaries.

