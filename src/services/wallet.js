const MONAD_TESTNET = {
  chainId: '0x279F', // 10143
  chainName: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

export const EXPLORER_URL = 'https://testnet.monadexplorer.com';

// ── Monad Testnet kontrat adresleri ──
export const CONTRACTS = {
  // Uniswap V3 SwapRouter02
  SWAP_ROUTER: '0xfe31f71c1b106eac32f1a19239c9a9a72ddfb900',
  // Token adresleri
  WETH:  '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  USDC:  '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
};

// Desteklenen token listesi
export const SWAP_TOKENS = [
  { symbol: 'MON',  label: 'MON',  icon: '◈', color: '#7b61ff', address: null  },
  { symbol: 'USDC', label: 'USDC', icon: '$', color: '#00f5a0', address: CONTRACTS.USDC },
  { symbol: 'WETH', label: 'WETH', icon: 'Ξ', color: '#4cc9f0', address: CONTRACTS.WETH },
  { symbol: 'PEPE', label: 'PEPE', icon: '🐸', color: '#16a34a', address: null },
  { symbol: 'WIF',  label: 'WIF',  icon: '🐶', color: '#f59e0b', address: null },
  { symbol: 'CHAD', label: 'CHAD', icon: '🗿', color: '#dc2626', address: null },
  { symbol: 'JOTCHUA', label: 'JOTCHUA', icon: '🐶', color: '#d97706', address: null }
];

export function isMetaMaskAvailable() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export async function connectWallet() {
  if (!isMetaMaskAvailable()) throw new Error('NO_METAMASK');

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || !accounts.length) throw new Error('NO_ACCOUNTS');

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET.chainId }],
    });
  } catch (err) {
    if (err.code === 4902 || err.code === -32603) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [MONAD_TESTNET],
      });
    } else {
      throw err;
    }
  }

  return accounts[0].toLowerCase();
}

export async function getConnectedAccount() {
  if (!isMetaMaskAvailable()) return null;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || !accounts.length) return null;
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== MONAD_TESTNET.chainId) return null;
    return accounts[0].toLowerCase();
  } catch {
    return null;
  }
}

// ── Basit MON transfer (native) ──
export async function sendTradeTransaction(from, to, amountMon) {
  const units = BigInt(Math.round(amountMon * 1e9)) * 10n ** 9n;
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to,
      value: '0x' + units.toString(16),
      gas: '0x5208',
    }],
  });
  return txHash;
}

// ── Uniswap V3 exactInputSingle: MON (native) → ERC-20 token ──
// SwapRouter02.exactInputSingle ile ETH/MON'u token'a swap eder
export async function swapMonForToken(from, tokenAddress, amountMon, slippagePct = 3) {
  const amountInWei = BigInt(Math.round(amountMon * 1e9)) * 10n ** 9n;

  // amountOutMinimum: slippage toleransı (varsayılan %3, testnet için geniş tutuldu)
  const amountOutMin = 0n; // testnet'te likidite garanti olmadığı için 0

  // exactInputSingle params struct (Uniswap V3 SwapRouter02)
  // function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut)
  // ExactInputSingleParams: tokenIn, tokenOut, fee, recipient, amountIn, amountOutMinimum, sqrtPriceLimitX96
  //
  // WETH9 adresini tokenIn olarak kullan (native ETH/MON için SwapRouter02 destekliyor)
  // Fee tier: 3000 (0.3%) — en yaygın havuz
  const FEE = 3000n;
  const SQRT_PRICE_LIMIT = 0n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 dk

  // ABI encode: exactInputSingle selector + params
  // selector: keccak256("exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))")[0..3]
  // = 0x414bf389
  const selector = '414bf389';

  function pad32(hexVal) {
    return hexVal.replace('0x', '').padStart(64, '0');
  }

  // tokenIn = WETH adresi (SwapRouter02, payable çağrıda native MON'u WETH olarak işler)
  const tokenIn = CONTRACTS.WETH.toLowerCase().replace('0x', '');
  const tokenOut = tokenAddress.toLowerCase().replace('0x', '');
  const fee = pad32(FEE.toString(16));
  const recipient = pad32(from.replace('0x', ''));
  const amountIn = pad32(amountInWei.toString(16));
  const amountOutMinimum = pad32(amountOutMin.toString(16));
  const sqrtPriceLimit = pad32(SQRT_PRICE_LIMIT.toString(16));

  const calldata = '0x' + selector +
    pad32(tokenIn) +
    pad32(tokenOut) +
    fee +
    recipient +
    amountIn +
    amountOutMinimum +
    sqrtPriceLimit;

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: CONTRACTS.SWAP_ROUTER,
      value: '0x' + amountInWei.toString(16),
      data: calldata,
      gas: '0x493E0', // ~300k gas — swap için yeterli
    }],
  });

  return txHash;
}

// ── Ana işlem fonksiyonu: token'a göre swap ya da transfer ──
export async function executeTradeTransaction(from, traderAddress, amountMon, tokenSymbol, tokenAddress) {
  // MON seçilmişse → direkt transfer
  if (!tokenSymbol || tokenSymbol === 'MON') {
    return sendTradeTransaction(from, traderAddress, amountMon);
  }

  // Sabit listede varsa adresini al (case-insensitive)
  const symUpper = tokenSymbol.toUpperCase();
  const knownToken = SWAP_TOKENS.find(t => t.symbol.toUpperCase() === symUpper);
  const targetAddress = tokenAddress || knownToken?.address;

  if (!targetAddress) {
    // Adresi bilinmeyen token → MON transfer
    return sendTradeTransaction(from, traderAddress, amountMon);
  }

  try {
    return await swapMonForToken(from, targetAddress, amountMon);
  } catch {
    // Swap fail (pool yok, likidite yok, vb.) → MON transfer'a düş
    return sendTradeTransaction(from, traderAddress, amountMon);
  }
}
