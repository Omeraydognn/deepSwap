/**
 * DexScreener API Service — Monad chain
 * Base: https://api.dexscreener.com
 */

const DSX_BASE = 'https://api.dexscreener.com';

// Known Monad mainnet token addresses
export const MONAD_TOKENS = {
  MON: {
    address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    symbol: 'MON',
    name: 'Monad',
    icon: '◈',
    color: '#836ef9',
  },
  USDC: {
    address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '$',
    color: '#2775ca',
  },
  USDT0: {
    address: '0xe7cd86e13AC4309349F30B3435a9d337750fC82D',
    symbol: 'USDT0',
    name: 'USDT0',
    icon: '₮',
    color: '#26a17b',
  },
  WETH: {
    address: '0x836047a99e11f376522b447bffb6e5495a5ad05e',
    symbol: 'WETH',
    name: 'Wrapped ETH',
    icon: 'Ξ',
    color: '#627eea',
  },
};

async function dexFetch(path, timeout = 8000) {
  try {
    const res = await fetch(`${DSX_BASE}${path}`, {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch pair data for a specific token on Monad chain
 * Returns the best (highest volume) pair found
 * NOTE: /token-pairs/v1 returns a raw array (no wrapper object)
 */
export async function fetchTokenPairData(tokenAddress) {
  const data = await dexFetch(`/token-pairs/v1/monad/${tokenAddress}`);
  const pairs = Array.isArray(data) ? data : data?.pairs ?? [];
  if (!pairs.length) return null;
  return [...pairs].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))[0];
}

/**
 * Fetch Monad trending tokens from DexScreener
 * Returns top tokens with price/volume/change data
 */
export async function fetchMonadTrendingTokens(limit = 20) {
  const data = await dexFetch('/latest/dex/search?q=MON');
  const pairs = Array.isArray(data) ? data : data?.pairs ?? [];
  
  // Mock Meme/New tokens simulating newbie 5h/10h tokens
  const mockMemes = [
    {
      chainId: 'monad',
      pairAddress: '0xmockpepe123',
      baseToken: { address: '0xpepe', symbol: 'PEPE', name: 'Pepe' },
      quoteToken: { address: '0xmon', symbol: 'MON', name: 'Monad' },
      priceUsd: '0.00042',
      priceChange: { h24: 154.2 },
      volume: { h24: 1205000 },
      pairCreatedAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
      info: { imageUrl: 'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933.png' }
    },
    {
      chainId: 'monad',
      pairAddress: '0xmockwif123',
      baseToken: { address: '0xwif', symbol: 'WIF', name: 'dogwifhat' },
      quoteToken: { address: '0xmon', symbol: 'MON', name: 'Monad' },
      priceUsd: '2.45',
      priceChange: { h24: 82.1 },
      volume: { h24: 3400000 },
      pairCreatedAt: Date.now() - 10 * 60 * 60 * 1000, // 10 hours ago
      info: { imageUrl: 'https://dd.dexscreener.com/ds-data/tokens/solana/ekpQGSJtjJVq124Dtz4x2DCDg8t21YvK2sS1xM61zS_5.png' }
    },
    {
      chainId: 'monad',
      pairAddress: '0xmockchad123',
      baseToken: { address: '0xchad', symbol: 'CHAD', name: 'GigaChad' },
      quoteToken: { address: '0xmon', symbol: 'MON', name: 'Monad' },
      priceUsd: '0.051',
      priceChange: { h24: 450.5 },
      volume: { h24: 890000 },
      pairCreatedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      info: { imageUrl: 'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x6b89b97169a797d94f057f4a0b01e2ca303155e4.png' }
    },
    {
      chainId: 'monad',
      pairAddress: '0xmockjotchua123',
      baseToken: { address: '0xjotchua', symbol: 'JOTCHUA', name: 'Baby Jotchua' },
      quoteToken: { address: '0xmon', symbol: 'MON', name: 'Monad' },
      priceUsd: '0.0012',
      priceChange: { h24: 1250.0 },
      volume: { h24: 560000 },
      pairCreatedAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
      info: { imageUrl: 'https://cdn.dexscreener.com/cms/images/FV9vlr_PRu-oJzED?width=64&height=64&fit=crop&quality=95&format=auto' }
    }
  ];

  const realPairs = pairs.filter((p) => p.chainId === 'monad');
  const combined = [...mockMemes, ...realPairs].slice(0, limit);
  return combined.map(normalizePair);
}

/**
 * Fetch multiple tokens by addresses at once
 */
export async function fetchTokensByAddresses(addresses) {
  if (!addresses?.length) return [];
  const data = await dexFetch(`/tokens/v1/monad/${addresses.join(',')}`);
  const pairs = Array.isArray(data) ? data : data?.pairs ?? [];
  return pairs.map(normalizePair);
}

/**
 * Normalize a DexScreener pair response into a clean token info object
 */
export function normalizePair(pair) {
  return {
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    url: pair.url,
    baseToken: {
      address: pair.baseToken?.address,
      symbol: pair.baseToken?.symbol,
      name: pair.baseToken?.name,
    },
    quoteToken: {
      address: pair.quoteToken?.address,
      symbol: pair.quoteToken?.symbol,
      name: pair.quoteToken?.name,
    },
    priceUsd: parseFloat(pair.priceUsd ?? 0),
    priceNative: parseFloat(pair.priceNative ?? 0),
    priceChange: {
      m5:  pair.priceChange?.m5  ?? 0,
      h1:  pair.priceChange?.h1  ?? 0,
      h6:  pair.priceChange?.h6  ?? 0,
      h24: pair.priceChange?.h24 ?? 0,
    },
    volume: {
      h24: pair.volume?.h24 ?? 0,
      h6:  pair.volume?.h6  ?? 0,
      h1:  pair.volume?.h1  ?? 0,
    },
    txns: {
      h24Buys:  pair.txns?.h24?.buys  ?? 0,
      h24Sells: pair.txns?.h24?.sells ?? 0,
    },
    liquidity:  pair.liquidity?.usd ?? 0,
    fdv:        pair.fdv        ?? 0,
    marketCap:  pair.marketCap  ?? 0,
    imageUrl:   pair.info?.imageUrl ?? null,
    dexUrl:     pair.url ?? null,
    createdAt:  pair.pairCreatedAt ?? null,
  };
}

/**
 * Get MON price data — highest-volume MON/USDC pair on Monad
 * /token-pairs/v1 returns a raw array, NOT {pairs:[...]}
 */
export async function fetchMONPrice() {
  const data = await dexFetch(
    `/token-pairs/v1/monad/${MONAD_TOKENS.MON.address}`
  );

  // API returns a plain array
  const pairs = Array.isArray(data) ? data : data?.pairs ?? [];
  if (!pairs.length) return null;

  // Prefer USDC quote, sort by 24h volume
  const usdcPairs = pairs
    .filter((p) => p.quoteToken?.symbol === 'USDC')
    .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));

  const best = usdcPairs[0] ?? pairs.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))[0];
  return normalizePair(best);
}

/**
 * Calculate PnL for a portfolio position
 * entryPriceUsd: price at which user bought
 * currentPriceUsd: current price
 * amountMon: how many MON were spent
 */
export function calcPnL(entryPriceUsd, currentPriceUsd, amountMon) {
  if (!entryPriceUsd || !currentPriceUsd) return null;
  const entryValue = amountMon * entryPriceUsd;
  const currentValue = amountMon * currentPriceUsd;
  const pnlUsd = currentValue - entryValue;
  const pnlPct = ((currentPriceUsd - entryPriceUsd) / entryPriceUsd) * 100;
  return { entryValue, currentValue, pnlUsd, pnlPct };
}
