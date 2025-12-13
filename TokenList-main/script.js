import readline from "readline";
import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let requestCount = 0;
let lastRequestTime = Date.now();

async function fetchWithRetry(url, retries = 3, baseDelay = 2000) {
  const now = Date.now();
  if (now - lastRequestTime >= 60000) {
    requestCount = 0;
    lastRequestTime = now;
  }

  if (requestCount >= 25) {
    const waitTime = 60000 - (now - lastRequestTime) + 1000;
    await sleep(waitTime);
    requestCount = 0;
    lastRequestTime = Date.now();
  }

  requestCount++;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      const errorBody = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorBody;
      } catch {
        errorMessage = errorBody;
      }

      if (response.status === 429) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited. Error: ${errorMessage}`);
        await sleep(delay);
        continue;
      }

      throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Request failed: ${err.message}`);
      await sleep(delay);
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const MARKET_CAP_THRESHOLD = 1_000_000;

rl.question(
  "Enter chain/platform name (e.g., ethereum, polygon-pos, ethereum-classic): ",
  async (platformName) => {
    try {
      // STEP 1: Fetch tokens with contract addresses on this chain
      console.log("Fetching initial token list...");
      const listResponse = await fetchWithRetry(process.env.COINGECKO_LIST_URL);
      const allTokens = await listResponse.json();
      const chainTokens = allTokens.filter(
        (t) => t.platforms && t.platforms[platformName]
      );

      if (chainTokens.length === 0) {
        console.log(`❌ No tokens found for chain: ${platformName}`);
        rl.close();
        return;
      }

      console.log(
        `✅ Found ${chainTokens.length} tokens with contracts on ${platformName}`
      );

      // STEP 2: Break IDs into batches (CoinGecko limit ~250 per request)
      const batches = [];
      for (let i = 0; i < chainTokens.length; i += 200) {
        batches.push(chainTokens.slice(i, i + 200));
      }

      let finalList = [];
      let processedCount = 0;
      let skippedCount = 0;
      let currentThreshold = MARKET_CAP_THRESHOLD;

      // Adjust threshold if token count is low
      if (chainTokens.length < 100) {
        console.log(
          `Small number of tokens (${chainTokens.length}) found, removing market cap filter...`
        );
        currentThreshold = 0;
      }

      for (const batch of batches) {
        const ids = batch.map((t) => t.id).join(",");

        const url = `${process.env.COINGECKO_MARKET_URL}?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&x_cg_demo_api_key=${process.env.API_KEY}`;
        try {
          const marketResponse = await fetchWithRetry(url);
          // Add a small delay between batch requests to avoid rate limits
          await sleep(1000);

          const marketData = await marketResponse.json();

          // STEP 3: Merge market data with contract addresses and filter by threshold
          for (const md of marketData) {
            try {
              const original = chainTokens.find((t) => t.id === md.id);
              if (!original) {
                skippedCount++;
                continue;
              }

              if (md.market_cap >= currentThreshold) {
                finalList.push({
                  id: md.id,
                  symbol: md.symbol,
                  name: md.name,
                  image: md.image,
                  contract_address: original.platforms[platformName],
                });
                processedCount++;
              }
            } catch (err) {
              console.log(
                `Warning: Failed to process token ${md.id}: ${err.message}`
              );
              skippedCount++;
            }
          }
        } catch (err) {
          console.log(`Warning: Failed to process batch: ${err.message}`);
          continue;
        }
      }

      console.log(
        `📊 Successfully processed ${processedCount} tokens, skipped ${skippedCount} tokens\n` +
          `After filtering by market cap > $${currentThreshold.toLocaleString()} → ${
            finalList.length
          } tokens remain`
      );

      // STEP 4: Save to file
      const fileName = `${platformName}-tokens.json`;
      fs.writeFileSync(fileName, JSON.stringify(finalList, null, 2));
    } catch (err) {
      console.error("❌ Error:", err.message);
    } finally {
      rl.close();
    }
  }
);
