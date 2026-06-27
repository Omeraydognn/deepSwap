import { useCallback, useEffect, useRef, useState } from 'react';
import SwipeCard from './components/SwipeCard';
import Leaderboard from './components/Leaderboard';
import mockTraders from './data/mockTraders.json';
import { fetchTopTraders, fetchMonadStats } from './services/monadApi';
import {
  connectWallet,
  getConnectedAccount,
  sendTradeTransaction,
  isMetaMaskAvailable,
  EXPLORER_URL,
} from './services/wallet';

/* ── Clock hook ── */
function useClock() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ── Toast config ── */
const TOASTS = {
  pass:       { msg: 'Skipped',              icon: '✕', color: 'rgba(255,71,87,0.95)',   border: 'rgba(255,71,87,0.3)' },
  copy:       { msg: 'Copy Trade Sent!',     icon: '✓', color: 'rgba(0,192,135,0.95)',  border: 'rgba(0,192,135,0.3)' },
  ape:        { msg: 'All In!',             icon: '💸', color: 'rgba(255,181,71,0.95)', border: 'rgba(255,181,71,0.3)' },
  connect:    { msg: 'Wallet Connected',    icon: '🟢', color: 'rgba(0,192,135,0.95)',  border: 'rgba(0,192,135,0.3)' },
  tx_sent:    { msg: 'Tx Sent!',           icon: '⛓',  color: 'rgba(123,97,255,0.95)', border: 'rgba(123,97,255,0.3)' },
  tx_error:   { msg: 'Tx Failed',          icon: '⚠',  color: 'rgba(255,71,87,0.95)',  border: 'rgba(255,71,87,0.3)' },
  no_wallet:  { msg: 'Install MetaMask!',  icon: '🦊', color: 'rgba(255,181,71,0.95)', border: 'rgba(255,181,71,0.3)' },
};

/* ── SVG Nav Icons ── */
function IconDeck({ active }) {
  const c = active ? '#FFB547' : '#4B5568';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="8" width="16" height="13" rx="3" stroke={c} strokeWidth="1.6"/>
      <rect x="7" y="5" width="13" height="12" rx="3" stroke={c} strokeWidth="1.6"/>
      {active && <rect x="4" y="8" width="16" height="13" rx="3" fill="#FFB547" fillOpacity="0.2"/>}
    </svg>
  );
}

function IconPortfolio({ active }) {
  const c = active ? '#1BC7B3' : '#4B5568';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1.5" fill={c} fillOpacity={active ? 1 : 0.6}/>
      <rect x="10" y="7" width="4" height="14" rx="1.5" fill={c} fillOpacity={active ? 1 : 0.6}/>
      <rect x="17" y="3" width="4" height="18" rx="1.5" fill={c} fillOpacity={active ? 1 : 0.6}/>
    </svg>
  );
}

function IconLeaderboard({ active }) {
  const c = active ? '#FFB547' : '#4B5568';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
        stroke={c} strokeWidth="1.6" strokeLinejoin="round"
        fill={active ? c : 'none'} fillOpacity={active ? 0.2 : 0}/>
    </svg>
  );
}

function IconProfile({ active }) {
  const c = active ? '#1BC7B3' : '#4B5568';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6"
        fill={active ? c : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

const TABS = [
  { id: 'deck',         Icon: IconDeck,        label: 'Deck' },
  { id: 'portfolio',    Icon: IconPortfolio,   label: 'Portfolio' },
  { id: 'leaderboard', Icon: IconLeaderboard,  label: 'Top' },
  { id: 'profile',     Icon: IconProfile,      label: 'Profile' },
];

/* ── Empty tab placeholder ── */
function EmptyTab({ icon, title, desc, badge }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8">
      <div className="relative">
        <div className="grid h-20 w-20 place-items-center rounded-[24px] text-4xl"
          style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
          {icon}
        </div>
        {badge && (
          <span className="absolute -top-1 -right-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{ background: 'var(--volt)', color: '#fff' }}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-base font-black" style={{ color: 'var(--text-1)' }}>{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed max-w-[220px]" style={{ color: 'var(--text-3)' }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Stat chip ── */
function StatChip({ label, value, accent }) {
  return (
    <div className="stat-chip flex-1 min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-[12px] font-black mt-0.5 truncate" style={{ color: accent ?? 'var(--text-1)' }}>{value}</p>
    </div>
  );
}

/* ── Signal dots (status bar) ── */
function SignalDots() {
  return (
    <div className="flex items-end gap-[2px]">
      {[8, 12, 16, 20].map((h, i) => (
        <div key={i} className="w-1 rounded-sm" style={{ height: h, background: i < 3 ? 'var(--text-2)' : 'var(--text-3)' }} />
      ))}
    </div>
  );
}

export default function App() {
  const clock = useClock();
  const [isConnected, setIsConnected]   = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [cards, setCards]               = useState(mockTraders.map(t => ({ ...t, isLive: false })));
  const [toast, setToast]               = useState(null);
  const [matchTrader, setMatchTrader]   = useState(null);
  const [showApe, setShowApe]           = useState(false);
  const [activeTab, setActiveTab]       = useState('deck');
  const [isLoading, setIsLoading]       = useState(false);
  const [isLiveData, setIsLiveData]     = useState(false);
  const [stats, setStats]               = useState(null);
  const [lastTxHash, setLastTxHash]     = useState(null);
  const topCardRef  = useRef(null);
  const matchTimer  = useRef(null);

  // Auto-reconnect if MetaMask already authorized
  useEffect(() => {
    getConnectedAccount().then((addr) => {
      if (addr) { setWalletAddress(addr); setIsConnected(true); }
    });

    if (isMetaMaskAvailable()) {
      const handleAccountsChanged = (accounts) => {
        if (!accounts.length) { setIsConnected(false); setWalletAddress(null); }
        else { setWalletAddress(accounts[0].toLowerCase()); }
      };
      const handleChainChanged = () => window.location.reload();
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    setIsLoading(true);
    Promise.all([fetchTopTraders(), fetchMonadStats()]).then(([result, statsData]) => {
      if (result.traders) { setCards(result.traders); setIsLiveData(true); }
      if (statsData) setStats(statsData);
    }).finally(() => setIsLoading(false));
  }, [isConnected]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => () => clearTimeout(matchTimer.current), []);

  const showToast = (type) => setToast({ type, key: Date.now() });

  const removeCard = useCallback((trader) => {
    setCards((prev) => prev.filter((c) => c.id !== trader.id));
  }, []);

  const sendTx = useCallback(async (trader, amountMon) => {
    if (!walletAddress || !trader.address) return;
    try {
      const txHash = await sendTradeTransaction(walletAddress, trader.address, amountMon);
      setLastTxHash(txHash);
      showToast('tx_sent');
    } catch (err) {
      if (err.code !== 4001) showToast('tx_error');
    }
  }, [walletAddress]);

  const handleSwipeLeft  = useCallback((t) => { removeCard(t); showToast('pass'); }, [removeCard]);
  const handleSwipeRight = useCallback((t) => {
    removeCard(t); showToast('copy');
    sendTx(t, 0.001);
    if (Math.random() < 0.35) {
      matchTimer.current = setTimeout(() => setMatchTrader(t), 2400);
    }
  }, [removeCard, sendTx]);
  const handleSwipeUp = useCallback((t) => {
    removeCard(t); showToast('ape');
    setShowApe(true);
    setTimeout(() => setShowApe(false), 1200);
    sendTx(t, 0.005);
  }, [removeCard, sendTx]);

  const swipe = (dir) => topCardRef.current?.swipe(dir);

  const resetDeck = () => {
    setCards(mockTraders.map(t => ({ ...t, isLive: false })));
    setIsLiveData(false);
    if (isConnected) {
      setIsLoading(true);
      fetchTopTraders().then((result) => {
        if (result.traders) { setCards(result.traders); setIsLiveData(true); }
      }).finally(() => setIsLoading(false));
    }
  };

  const t = toast ? TOASTS[toast.type] : null;

  return (
    <div className="mobile-shell">

      {/* ── APE BURST ── */}
      {showApe && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
          <div className="animate-rocket flex flex-col items-center gap-3">
            <span className="text-8xl">🚀</span>
            <span className="text-2xl font-black uppercase tracking-widest" style={{ color: 'var(--warn)' }}>All In!</span>
          </div>
        </div>
      )}

      {/* ── STATUS BAR ── */}
      <div className="status-bar">
        <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{clock}</span>
        <div className="flex items-center gap-3">
          <SignalDots />
          <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
            <path d="M7.5 3C9.5 3 11.3 3.8 12.6 5.1L14 3.7C12.3 2 10 1 7.5 1S2.7 2 1 3.7L2.4 5.1C3.7 3.8 5.5 3 7.5 3z" fill="var(--text-2)"/>
            <path d="M7.5 6C8.9 6 10.1 6.6 11 7.5L12.4 6.1C11.1 4.8 9.4 4 7.5 4S3.9 4.8 2.6 6.1L4 7.5C4.9 6.6 6.1 6 7.5 6z" fill="var(--text-2)"/>
            <circle cx="7.5" cy="10" r="1.5" fill="var(--text-2)"/>
          </svg>
          <div className="flex items-center gap-1">
            <div className="h-3 rounded-sm" style={{ width: 20, background: 'var(--profit)', borderRadius: 2 }} />
            <span style={{ color: 'var(--text-2)', fontSize: 10 }}>87%</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── ONBOARDING ── */}
        {!isConnected ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">

            {/* Logo */}
            <div className="relative mb-6">
              <div className="animate-pulse-glow animate-float grid h-24 w-24 place-items-center rounded-[28px] text-5xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,181,71,0.22) 0%, rgba(27,199,179,0.10) 100%)',
                  border: '1px solid rgba(255,181,71,0.30)',
                }}>
                ◈
              </div>
              <div className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full text-[11px] font-black"
                style={{ background: 'var(--volt)', color: '#1d1207', boxShadow: '0 4px 12px rgba(255,181,71,0.35)' }}>
                ✦
              </div>
            </div>

            {/* Brand */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.5em]" style={{ color: 'var(--monad)' }}>
              Monad Blitz · 2025
            </p>
            <h1 className="mt-3 text-[48px] font-black leading-[1.05] tracking-tight">
              Monad
              <br />
              <span style={{ background: 'linear-gradient(90deg, #FFB547, #1BC7B3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Swipe
              </span>
            </h1>
              <p className="mt-4 max-w-[260px] text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Copy-trading meets Tinder. Swipe right to copy, left to pass, up to go all in — all on Monad.
            </p>

            {/* Swipe hints */}
            <div className="mt-6 flex gap-4">
              {[
                { icon: '✕', label: 'Pass', color: 'var(--loss)', bg: 'rgba(255,71,87,0.1)' },
                { icon: '💸', label: 'All In', color: 'var(--warn)', bg: 'rgba(255,181,71,0.1)' },
                { icon: '✓', label: 'Copy', color: 'var(--profit)', bg: 'rgba(0,192,135,0.1)' },
              ].map(({ icon, label, color, bg }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl text-lg"
                    style={{ background: bg, border: `1px solid ${color}30`, color }}>
                    {icon}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Connect Button */}
            <button
              type="button"
              disabled={isConnecting}
              onClick={async () => {
                if (!isMetaMaskAvailable()) {
                  showToast('no_wallet');
                  window.open('https://metamask.io/download/', '_blank');
                  return;
                }
                setIsConnecting(true);
                try {
                  const addr = await connectWallet();
                  setWalletAddress(addr);
                  setIsConnected(true);
                  showToast('connect');
                } catch (err) {
                  if (err.message !== 'NO_METAMASK' && err.code !== 4001) showToast('tx_error');
                } finally {
                  setIsConnecting(false);
                }
              }}
              className="mt-8 w-full rounded-2xl py-4 text-[15px] font-black tracking-wide transition active:scale-[0.97]"
              style={{
                background: isConnecting
                  ? 'rgba(255,181,71,0.35)'
                  : 'linear-gradient(135deg, #FFB547 0%, #1BC7B3 100%)',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(255,181,71,0.28)',
                border: 'none',
                cursor: isConnecting ? 'wait' : 'pointer',
              }}
            >
              {isConnecting ? '⏳  Connecting…' : '🦊  Connect with MetaMask'}
            </button>

            {/* Sub-note */}
            <div className="mt-4 flex items-center gap-2">
              <span className="h-px w-8" style={{ background: 'var(--border)' }} />
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Monad Testnet · Auto-switch</p>
              <span className="h-px w-8" style={{ background: 'var(--border)' }} />
            </div>
          </div>

        ) : (
          <>
            {/* ── APP BAR ── */}
            <div className="app-bar">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: 'var(--volt)' }}>Monad Swipe</p>
                <h1 className="text-[20px] font-black tracking-tight leading-tight" style={{ color: 'var(--text-1)' }}>
                  {activeTab === 'deck' ? 'Trade Deck' :
                   activeTab === 'portfolio' ? 'Portfolio' :
                   activeTab === 'leaderboard' ? 'Leaderboard' : 'Profile'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {isLiveData && (
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ background: 'rgba(0,192,135,0.1)', border: '1px solid rgba(0,192,135,0.25)' }}>
                    <div className="h-1.5 w-1.5 rounded-full animate-live-pulse" style={{ background: 'var(--profit)' }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--profit)' }}>LIVE</span>
                  </div>
                )}
                {walletAddress && (
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.20)' }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#FFB547' }} />
                    <span className="text-[10px] font-bold font-mono" style={{ color: '#FFD48C' }}>
                      {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── STATS STRIP ── */}
            {stats && (
              <div className="flex gap-2 px-4 mb-3">
                <StatChip label="Txns / s" value={parseInt(stats.totalTxns || 0, 10).toLocaleString()} accent="var(--monad)" />
                <StatChip label="Blocks" value={parseInt(stats.totalBlocks || 0, 10).toLocaleString()} />
                <StatChip label="Block Time" value={`${parseFloat(stats.avgBlockTime || 0).toFixed(2)}s`} accent="var(--profit)" />
              </div>
            )}

            {/* ── TAB CONTENT ── */}
            {activeTab === 'deck' ? (
              <>
                <div className="flex flex-1 flex-col items-center justify-center px-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-5">
                      <div className="h-12 w-12 rounded-full border-2 border-transparent"
                        style={{
                          borderTopColor: 'var(--volt)',
                          borderRightColor: 'rgba(255,181,71,0.24)',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>Fetching live traders…</p>
                    </div>
                  ) : cards.length > 0 ? (
                    <div className="card-deck-area">
                      {[...cards.slice(0, 4)].reverse().map((trader, i, arr) => {
                        const stackIndex = arr.length - 1 - i;
                        return (
                          <SwipeCard
                            key={trader.id}
                            ref={stackIndex === 0 ? topCardRef : null}
                            trader={trader}
                            stackIndex={stackIndex}
                            isTopCard={stackIndex === 0}
                            onSwipeLeft={handleSwipeLeft}
                            onSwipeRight={handleSwipeRight}
                            onSwipeUp={handleSwipeUp}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="card-deck-area grid place-items-center rounded-[28px] text-center"
                      style={{ background: 'var(--s1)', border: '1.5px dashed var(--border)' }}>
                      <div>
                        <p className="text-4xl mb-3">🃏</p>
                        <p className="text-sm font-black" style={{ color: 'var(--text-1)' }}>Deck Empty</p>
                        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>You've seen all traders.</p>
                        <button
                          type="button"
                          onClick={resetDeck}
                          className="mt-5 rounded-2xl px-6 py-2.5 text-sm font-black transition active:scale-[0.97]"
                          style={{
                            background: 'var(--volt-dim)',
                            border: '1px solid rgba(255,181,71,0.28)',
                            color: '#FFD48C',
                          }}
                        >
                          Reload Deck
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── ACTION BUTTONS ── */}
                {!isLoading && cards.length > 0 && (
                  <div className="action-row">
                    <button type="button" className="btn-pass" onClick={() => swipe('left')}>✕</button>

                    {/* Center FAB-style ALL IN button */}
                    <button type="button" className="btn-ape" onClick={() => swipe('up')}>ALL IN</button>

                    <button type="button" className="btn-copy" onClick={() => swipe('right')}>✓</button>
                  </div>
                )}
              </>

            ) : activeTab === 'portfolio' ? (
              <EmptyTab icon="📊" title="Portfolio" desc="Copied trades will appear here after your first swipe right." badge="Soon" />
            ) : activeTab === 'leaderboard' ? (
              <Leaderboard traders={cards.length > 0 ? cards : mockTraders} />
            ) : (
              <div className="flex flex-1 flex-col gap-4 px-4 pt-2 overflow-y-auto">
                {/* Wallet card */}
                <div className="rounded-[20px] p-4"
                  style={{ background: 'linear-gradient(135deg, rgba(123,97,255,0.15) 0%, rgba(34,211,238,0.08) 100%)', border: '1px solid rgba(123,97,255,0.25)' }}>
                  <p className="text-[9px] font-black uppercase tracking-[0.45em]" style={{ color: 'var(--volt)' }}>Connected Wallet</p>
                  <p className="mt-1.5 text-sm font-mono font-bold break-all" style={{ color: 'var(--text-1)' }}>{walletAddress}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: 'var(--profit)' }} />
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--profit)' }}>Monad Testnet</span>
                  </div>
                </div>

                {/* Last Tx */}
                {lastTxHash && (
                  <div className="rounded-[20px] p-4"
                    style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                    <p className="text-[9px] font-black uppercase tracking-[0.45em]" style={{ color: 'var(--text-3)' }}>Last Transaction</p>
                    <p className="mt-1.5 text-xs font-mono break-all" style={{ color: 'var(--text-2)' }}>{lastTxHash}</p>
                    <a
                      href={`${EXPLORER_URL}/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold"
                      style={{ color: '#FFB547' }}
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                )}

                {/* Hint */}
                {!lastTxHash && (
                  <div className="flex flex-col items-center justify-center gap-3 pt-8 text-center">
                    <span className="text-4xl">⛓</span>
                    <p className="text-sm font-black" style={{ color: 'var(--text-1)' }}>No Transactions Yet</p>
                    <p className="text-xs max-w-[200px]" style={{ color: 'var(--text-3)' }}>
                      Swipe right (0.001 MON) or up (0.005 MON) on a trader to send a real Monad Testnet transaction.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── BOTTOM NAV (Material 3) ── */}
            <nav className="bottom-nav">
              {TABS.map(({ id, Icon, label }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className="nav-item"
                    style={{ color: active ? 'var(--volt)' : 'var(--text-3)' }}
                  >
                    {active && <div className="nav-pill" />}
                    <div className="nav-icon pt-1">
                      <Icon active={active} />
                    </div>
                    <span className={`nav-label ${active ? 'active' : ''}`}
                      style={{ color: active ? 'var(--volt)' : 'var(--text-3)' }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* ── TOAST ── */}
      {t && (
        <div
          key={toast.key}
          className="animate-slide-up pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold"
          style={{
            background: t.color,
            border: `1px solid ${t.border}`,
            color: '#fff',
            boxShadow: `0 8px 24px ${t.border}`,
            backdropFilter: 'blur(16px)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{t.icon}</span>
          <span>{t.msg}</span>
        </div>
      )}

      {/* ── PROFIT MATCH MODAL ── */}
      {matchTrader && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}>
          <div className="animate-slide-up-modal w-full max-w-sm rounded-[32px] p-6 text-center"
            style={{
              background: 'linear-gradient(160deg, var(--s2) 0%, var(--s1) 100%)',
              border: '1px solid rgba(0,192,135,0.2)',
              boxShadow: '0 24px 80px rgba(0,192,135,0.15)',
            }}>
            <div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-3xl text-3xl"
              style={{ background: 'rgba(0,192,135,0.15)', border: '1px solid rgba(0,192,135,0.3)' }}>
              💰
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.45em]" style={{ color: 'var(--profit)' }}>
              Profit Match
            </p>
            <h2 className="mt-1 text-2xl font-black" style={{ color: 'var(--text-1)' }}>It's a Match!</h2>
            <p className="mt-1 text-lg font-black" style={{ color: 'var(--profit)' }}>+20% Profit Target Hit!</p>

            <div className="my-4 rounded-2xl p-3 text-left"
              style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Copied Trade</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{matchTrader.actionText}</p>
              <p className="mt-0.5 text-xs font-mono" style={{ color: 'var(--text-2)' }}>
                {matchTrader.address?.slice(0, 14)}…
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  if (lastTxHash) {
                    window.open(`${EXPLORER_URL}/tx/${lastTxHash}`, '_blank');
                  }
                  setMatchTrader(null);
                }}
                className="rounded-2xl py-3.5 text-sm font-black transition active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, var(--profit) 0%, #00a070 100%)',
                  color: '#fff',
                  boxShadow: '0 6px 20px rgba(0,192,135,0.35)',
                  border: 'none',
                }}
              >
                💸  {lastTxHash ? 'View Tx on Explorer' : 'Take Profit'}
              </button>
              <button
                type="button"
                onClick={() => setMatchTrader(null)}
                className="rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.97]"
                style={{
                  background: 'var(--s3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                }}
              >
                💎  HODL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
