import { describe, it, expect } from 'vitest';

import { config } from '../utils/wagmiConfig';
import { SUPPORTED_CHAINS as FEED_SUPPORTED_CHAINS } from '../utils/supportedChainFeed';
import { SUPPORTED_CHAIN_IDS as IDB_CHAIN_IDS } from '../lib/indexeddb/config';
import { SUPPORTED_CHAIN_IDS as LIB_CHAIN_IDS, CHAIN_METADATA } from '../lib/chains';

const normalize = (values: readonly number[]) => [...values].sort((a, b) => a - b);

describe('Single source of truth for supported chains', () => {
  const wagmiChainIds = config.chains.map((chain) => chain.id);

  it('supportedChainFeed.SUPPORTED_CHAINS matches wagmiConfig', () => {
    expect(normalize(FEED_SUPPORTED_CHAINS)).toEqual(normalize(wagmiChainIds));
  });

  it('indexeddb config matches wagmiConfig', () => {
    expect(normalize(IDB_CHAIN_IDS)).toEqual(normalize(wagmiChainIds));
  });

  it('lib/chains SUPPORTED_CHAIN_IDS matches wagmiConfig', () => {
    expect(normalize(LIB_CHAIN_IDS)).toEqual(normalize(wagmiChainIds));
  });
});

describe('Ethereum Classic metadata completeness', () => {
  const etcMeta = CHAIN_METADATA[61];

  it('is present', () => {
    expect(etcMeta).toBeDefined();
    expect(etcMeta?.shortName).toBe('ETC');
  });

  it('provides rpcUrls and block explorers', () => {
    expect(etcMeta?.rpcUrls?.default?.http).toContain('https://etc.rivet.link');
    expect(etcMeta?.blockExplorers?.default?.url).toBe('https://blockscout.com/etc/mainnet');
  });

  it('native currency includes a name field', () => {
    expect(etcMeta?.nativeCurrency.name).toBe('Ethereum Classic');
    expect(etcMeta?.nativeCurrency.symbol).toBe('ETC');
    expect(etcMeta?.nativeCurrency.decimals).toBe(18);
  });
});
