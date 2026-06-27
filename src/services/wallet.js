const MONAD_TESTNET = {
  chainId: '0x279F', // 10143
  chainName: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

export const EXPLORER_URL = 'https://testnet.monadexplorer.com';

export function isMetaMaskAvailable() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export async function connectWallet() {
  if (!isMetaMaskAvailable()) {
    throw new Error('NO_METAMASK');
  }

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

// amountMon: floating-point amount in MON (e.g. 0.001)
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
