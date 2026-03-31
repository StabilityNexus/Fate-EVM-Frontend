# 🧠 Fate Oracle Prototype (Backend)

## 🚀 Overview
This repository contains a prototype implementation of a decentralized oracle system for the Fate Protocol.

Unlike traditional oracles, this derives prices fully on-chain using bull/bear token economics.

---

## 🏗️ Architecture
- MockPool → provides reserves, supply, volume
- FateOracle → computes price + rounds
- IFateOracle → Chainlink-style interface

---

## 🧮 Price Derivation
bullPrice = bullReserve / bullSupply  
bearPrice = bearReserve / bearSupply  

Base Price = (bullPrice + bearPrice) / 2

---

## ⚠️ Precision Issue (IMPORTANT)

### Example (Observed During Fuzz Testing)

bearReserve = 2.49e17  
bearSupply  = 9.39e17  

→ bearPrice = 0 (due to integer division)

This behavior was observed during fuzz testing and reflects real-world Solidity precision loss.

---

## 🔄 Round System
Each update creates a new round storing price + timestamp.

---

## ⏳ Stale Protection
Reverts if data is too old.

---

## 🧪 Testing
- Unit tests
- Edge cases
- Fuzz testing

---

## ▶️ Run
forge compile
forge test -vv  
forge script script/DeployAndTest.s.sol

---

## 👤 Contributor
Sakil Uddin
