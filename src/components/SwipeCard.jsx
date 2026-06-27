import { forwardRef, useMemo, useRef, useState } from 'react';
import TinderCard from 'react-tinder-card';
import { EXPLORER_ADDR_URL } from '../services/monadApi';

function shortenAddress(addr) {
  if (!addr) return '0x000...000';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const TIER = {
  whale:       { label: 'Whale',       emoji: '🐋', color: '#4cc9f0', glow: 'rgba(76,201,240,0.5)',   bg: 'rgba(76,201,240,0.15)',  border: 'rgba(76,201,240,0.3)' },
  smart_money: { label: 'Smart Money', emoji: '⚡', color: '#f72585', glow: 'rgba(247,37,133,0.5)',   bg: 'rgba(247,37,133,0.15)',  border: 'rgba(247,37,133,0.3)' },
  pro:         { label: 'Pro',         emoji: '💎', color: '#7b61ff', glow: 'rgba(123,97,255,0.5)',   bg: 'rgba(123,97,255,0.15)',  border: 'rgba(123,97,255,0.3)' },
  degen:       { label: 'Degen',       emoji: '🔥', color: '#ff6b35', glow: 'rgba(255,107,53,0.5)',   bg: 'rgba(255,107,53,0.15)',  border: 'rgba(255,107,53,0.3)' },
  fresh:       { label: 'Fresh',       emoji: '🌱', color: '#00f5a0', glow: 'rgba(0,245,160,0.5)',    bg: 'rgba(0,245,160,0.15)',   border: 'rgba(0,245,160,0.3)' },
};

const TAG_COLOR = {
  Degen:    { c: '#ff6b35', bg: 'rgba(255,107,53,0.15)',  border: 'rgba(255,107,53,0.3)' },
  Safe:     { c: '#00f5a0', bg: 'rgba(0,245,160,0.15)',   border: 'rgba(0,245,160,0.3)' },
  Whale:    { c: '#4cc9f0', bg: 'rgba(76,201,240,0.15)',  border: 'rgba(76,201,240,0.3)' },
  Pro:      { c: '#7b61ff', bg: 'rgba(123,97,255,0.15)',  border: 'rgba(123,97,255,0.3)' },
  Sniper:   { c: '#f72585', bg: 'rgba(247,37,133,0.15)',  border: 'rgba(247,37,133,0.3)' },
  Breakout: { c: '#7b61ff', bg: 'rgba(123,97,255,0.15)',  border: 'rgba(123,97,255,0.3)' },
  Momentum: { c: '#ff9f1c', bg: 'rgba(255,159,28,0.15)',  border: 'rgba(255,159,28,0.3)' },
  Alpha:    { c: '#f72585', bg: 'rgba(247,37,133,0.15)',  border: 'rgba(247,37,133,0.3)' },
  Trend:    { c: '#4cc9f0', bg: 'rgba(76,201,240,0.15)',  border: 'rgba(76,201,240,0.3)' },
  Fast:     { c: '#00f5a0', bg: 'rgba(0,245,160,0.15)',   border: 'rgba(0,245,160,0.3)' },
  LowCap:   { c: '#ff6b35', bg: 'rgba(255,107,53,0.15)',  border: 'rgba(255,107,53,0.3)' },
  Fresh:    { c: '#00f5a0', bg: 'rgba(0,245,160,0.15)',   border: 'rgba(0,245,160,0.3)' },
  Early:    { c: '#f72585', bg: 'rgba(247,37,133,0.15)',  border: 'rgba(247,37,133,0.3)' },
};

const SENTIMENT_MAP = {
  bullish: { label: 'Bullish', icon: '↑', color: '#00f5a0' },
  bearish: { label: 'Bearish', icon: '↓', color: '#f72585' },
  neutral: { label: 'Neutral', icon: '→', color: '#7b61ff' },
};

const TOKEN_META = {
  MON:  { icon: '◈', color: '#7b61ff' },
  WETH: { icon: 'Ξ', color: '#4cc9f0' },
  USDC: { icon: '$', color: '#00f5a0' },
};

// Her adres için deterministic gradient + şekil
const AVATAR_CONFIGS = [
  { grad: ['#f72585','#7b61ff'], shape: 'abstract1' },
  { grad: ['#7b61ff','#4cc9f0'], shape: 'abstract2' },
  { grad: ['#ff6b35','#f72585'], shape: 'abstract3' },
  { grad: ['#00f5a0','#4cc9f0'], shape: 'abstract4' },
  { grad: ['#f72585','#ff6b35'], shape: 'abstract5' },
  { grad: ['#4cc9f0','#7b61ff'], shape: 'abstract6' },
  { grad: ['#7b61ff','#f72585'], shape: 'abstract7' },
  { grad: ['#ff6b35','#4cc9f0'], shape: 'abstract8' },
];

function getAvatarConfig(addr) {
  const sum = (addr || '0x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_CONFIGS[sum % AVATAR_CONFIGS.length];
}

// Ethereum blockie avatar — adrese göre MonadVision tarzı piksel resim
export function BlockieAvatar({ addr, size = 120 }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  const config = getAvatarConfig(addr);
  const [c1, c2] = config.grad;

  // effigy.im → cüzdan adresinden Ethereum blockie üretir
  const src = addr ? `https://effigy.im/a/${addr}.png` : null;

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      border: '3px solid rgba(255,255,255,0.25)',
      boxShadow: `0 0 0 4px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${c1}55`,
      position: 'relative',
      flexShrink: 0,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
    }}>
      {/* Placeholder gradient göster — resim yüklenene kadar */}
      {(!loaded || error) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${c1}cc, ${c2}aa)`,
          fontSize: size * 0.28, fontWeight: 900, color: '#fff',
          fontFamily: 'monospace',
          letterSpacing: '-1px',
          userSelect: 'none',
        }}>
          {addr ? addr.slice(2, 4).toUpperCase() : '??'}
        </div>
      )}
      {src && (
        <img
          src={src}
          alt="avatar"
          width={size}
          height={size}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: loaded && !error ? 'block' : 'none',
            imageRendering: 'pixelated',  // blockie pikselleri net görünsün
          }}
        />
      )}
    </div>
  );
}

// Tam kart boyutunda arka plan profil görseli
function CardBackground({ addr, tier }) {
  const config = getAvatarConfig(addr);
  const [c1, c2] = config.grad;
  const radId  = `rad-grad-${addr?.slice(2, 8) ?? 'xx'}`;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      borderRadius: 'inherit',
    }}>
      {/* Base gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(145deg, ${c1}55 0%, ${c2}33 50%, #0a0a1a 100%)`,
      }} />

      {/* SVG dekoratif şekiller */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 393 580"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={radId} cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor={c1} stopOpacity="0.35" />
            <stop offset="100%" stopColor={c2} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="196" cy="200" rx="170" ry="200" fill={`url(#${radId})`} />
        <ellipse cx="320" cy="80"  rx="80"  ry="80"  fill={c1} fillOpacity="0.1" />
        <ellipse cx="60"  cy="300" rx="60"  ry="60"  fill={c2} fillOpacity="0.08" />
        {/* Dekoratif halkalar */}
        <circle cx="196" cy="215" r="140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="196" cy="215" r="105" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {/* Floating particles */}
        <circle cx="80"  cy="80"  r="4" fill={c1} fillOpacity="0.5" />
        <circle cx="310" cy="120" r="3" fill={c2} fillOpacity="0.4" />
        <circle cx="50"  cy="220" r="5" fill={c1} fillOpacity="0.3" />
        <circle cx="340" cy="250" r="4" fill={c2} fillOpacity="0.35" />
        <circle cx="130" cy="50"  r="3" fill={c2} fillOpacity="0.4" />
        <circle cx="260" cy="60"  r="2" fill={c1} fillOpacity="0.5" />
        {/* Corner accents */}
        <path d="M0,0 L40,0 L0,40 Z" fill={c1} fillOpacity="0.1" />
        <path d="M393,0 L353,0 L393,40 Z" fill={c2} fillOpacity="0.1" />
      </svg>

      {/* ── Merkez: Gerçek Ethereum Blockie Avatar ── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -62%)',
        zIndex: 3,
      }}>
        <BlockieAvatar addr={addr} size={130} />
      </div>

      {/* Noise texture overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />
    </div>
  );
}

function Sparkline({ values = [], positive = true }) {
  if (!values || values.length < 2) return null;
  const W = 80, H = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${W},${H} L0,${H} Z`;
  const stroke = positive ? '#00f5a0' : '#f72585';
  const id = `sp-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${id})`} />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4"
        fill={stroke} stroke="rgba(0,0,0,0.5)" strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 6px ${stroke})` }} />
    </svg>
  );
}

function GlowBar({ value, color, height = 3 }) {
  return (
    <div style={{ width: '100%', height, borderRadius: height, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(value, 100)}%`,
        background: color,
        borderRadius: height,
        boxShadow: `0 0 8px ${color}`,
        transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </div>
  );
}

const SwipeCard = forwardRef(function SwipeCard(
  { trader, stackIndex = 0, isTopCard = false, onSwipeLeft, onSwipeRight, onSwipeUp, isFavorite, onToggleFavorite },
  ref
) {
  const [swipeDir, setSwipeDir] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPt = useRef(null);
  const activePointerId = useRef(null);
  const firedSwipe = useRef(null);

  if (!trader) return null;

  const handleSwipe = (direction) => {
    setSwipeDir(null);
    setDragOffset({ x: 0, y: 0 });
    startPt.current = null;
    firedSwipe.current = null;
    if (direction === 'left')  onSwipeLeft?.(trader);
    if (direction === 'right') onSwipeRight?.(trader);
    if (direction === 'up')    onSwipeUp?.(trader);
  };

  const triggerSwipe = (direction) => {
    if (firedSwipe.current || !isTopCard) return;
    firedSwipe.current = direction;
    setTimeout(() => { ref?.current?.swipe?.(direction); }, 0);
  };

  const trackStart = (e) => {
    if (!isTopCard) return;
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startPt.current = { x: e.clientX, y: e.clientY };
  };
  const trackMove = (e) => {
    if (!isTopCard || !startPt.current || activePointerId.current !== e.pointerId) return;
    const dx = e.clientX - startPt.current.x;
    const dy = e.clientY - startPt.current.y;
    const thr = 18;
    setDragOffset({ x: Math.max(-180, Math.min(180, dx)), y: Math.max(-120, Math.min(120, dy)) });
    if (Math.abs(dy) > Math.abs(dx) * 1.1 && dy < -thr) {
      setSwipeDir('up');
      if (Math.abs(dy) > 70) triggerSwipe('up');
    } else if (dx > thr) {
      setSwipeDir('right');
      if (dx > 70) triggerSwipe('right');
    } else if (dx < -thr) {
      setSwipeDir('left');
      if (dx < -70) triggerSwipe('left');
    } else {
      setSwipeDir(null);
    }
  };
  const trackEnd = (e) => {
    if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
    startPt.current = null;
    activePointerId.current = null;
    if (!firedSwipe.current) setDragOffset({ x: 0, y: 0 });
    setTimeout(() => setSwipeDir(null), 350);
  };

  const dragTransform = useMemo(() => {
    if (!isTopCard) return undefined;
    const rotate = dragOffset.x / 18;
    return `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`;
  }, [dragOffset.x, dragOffset.y, isTopCard]);

  const isPositive = trader.sentiment !== 'bearish';
  const token      = TOKEN_META[trader.tokenSymbol] ?? TOKEN_META.MON;
  const sentiment  = SENTIMENT_MAP[trader.sentiment] ?? SENTIMENT_MAP.neutral;
  const tier       = TIER[trader.tier] ?? TIER.fresh;
  const winColor   = trader.winRate >= 60 ? '#00f5a0' : trader.winRate >= 40 ? '#7b61ff' : '#f72585';
  const confColor  = trader.confidence >= 60 ? '#00f5a0' : trader.confidence >= 40 ? '#7b61ff' : '#f72585';
  const profitColor = isPositive ? '#00f5a0' : '#f72585';
  const config     = getAvatarConfig(trader.address);
  const [c1, c2]   = config.grad;

  // ── BACK CARDS (arka yığın) ──
  if (stackIndex > 0) {
    return (
      <TinderCard
        ref={ref}
        className="absolute left-0 top-0 h-full w-full"
        style={{ touchAction: 'none' }}
        preventSwipe={['left', 'right', 'up', 'down']}
        swipeRequirementType="position"
        swipeThreshold={50}
        onSwipe={handleSwipe}
      >
        <div style={{
          zIndex: 30 - stackIndex,
          transform: `translateY(${stackIndex * 14}px) scale(${1 - stackIndex * 0.04})`,
          borderRadius: 28,
          background: stackIndex === 1
            ? 'linear-gradient(145deg, rgba(123,97,255,0.2), rgba(18,18,26,0.95))'
            : 'linear-gradient(145deg, rgba(76,201,240,0.12), rgba(14,14,22,0.95))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Subtle bg hint for back cards */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(145deg, ${c1}15 0%, transparent 60%)`,
          }} />
        </div>
      </TinderCard>
    );
  }

  // ── TOP CARD ──
  return (
    <TinderCard
      ref={ref}
      className="absolute left-0 top-0 h-full w-full"
      style={{ touchAction: 'none' }}
      preventSwipe={isTopCard ? ['down'] : ['left', 'right', 'up', 'down']}
      swipeRequirementType="position"
      swipeThreshold={50}
      onSwipe={handleSwipe}
    >
      <article
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{
          zIndex: 30,
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px ${c1}20`,
          pointerEvents: isTopCard ? 'auto' : 'none',
          userSelect: 'none',
          touchAction: 'none',
          cursor: isTopCard ? 'grab' : 'default',
          transform: dragTransform,
          transition: firedSwipe.current ? 'transform 0.18s ease-out' : startPt.current ? 'none' : 'transform 0.18s ease-out',
          willChange: isTopCard ? 'transform' : undefined,
          background: '#0a0a1a',
        }}
        onPointerDown={trackStart}
        onPointerMove={trackMove}
        onPointerUp={trackEnd}
        onPointerCancel={trackEnd}
      >

        {/* ════════════════════════════════
            ARK A PLAN: Profil görseli (üst ~60%)
        ════════════════════════════════ */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '38%', zIndex: 0 }}>
          <CardBackground addr={trader.address} tier={trader.tier} />

          {/* Bottom fade overlay – alt bilgi paneli ile geçiş */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(8,8,16,0.7) 50%, rgba(8,8,16,0.98) 100%)',
            zIndex: 2,
          }} />
        </div>

        {/* ── SWIPE OVERLAYS ── */}
        {swipeDir === 'right' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 25, borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(0,245,160,0.18) 0%, transparent 60%)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 20,
          }}>
            <span style={{
              border: '2.5px solid #00f5a0', color: '#00f5a0',
              background: 'rgba(0,245,160,0.12)',
              borderRadius: 16, padding: '8px 20px',
              fontSize: 15, fontWeight: 900, letterSpacing: '0.08em',
              transform: 'rotate(-15deg)',
              textShadow: '0 0 20px rgba(0,245,160,0.8)',
              boxShadow: '0 0 30px rgba(0,245,160,0.4)',
            }}>COPY ✓</span>
          </div>
        )}
        {swipeDir === 'left' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 25, borderRadius: 28,
            background: 'linear-gradient(225deg, rgba(247,37,133,0.18) 0%, transparent 60%)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 20,
          }}>
            <span style={{
              border: '2.5px solid #f72585', color: '#f72585',
              background: 'rgba(247,37,133,0.12)',
              borderRadius: 16, padding: '8px 20px',
              fontSize: 15, fontWeight: 900, letterSpacing: '0.08em',
              transform: 'rotate(15deg)',
              textShadow: '0 0 20px rgba(247,37,133,0.8)',
              boxShadow: '0 0 30px rgba(247,37,133,0.4)',
            }}>PASS ✕</span>
          </div>
        )}
        {swipeDir === 'up' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 25, borderRadius: 28,
            background: 'linear-gradient(0deg, rgba(247,37,133,0.25) 0%, rgba(123,97,255,0.15) 50%, transparent 100%)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 80,
          }}>
            <span style={{
              border: '2.5px solid #f72585', color: '#f72585',
              background: 'rgba(247,37,133,0.15)',
              borderRadius: 16, padding: '8px 24px',
              fontSize: 15, fontWeight: 900, letterSpacing: '0.08em',
              textShadow: '0 0 20px rgba(247,37,133,0.8)',
              boxShadow: '0 0 30px rgba(247,37,133,0.4)',
            }}>ALL IN 💸</span>
          </div>
        )}

        {/* ── TOP BAR: Tier badge (profil üstünde) ── */}
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          pointerEvents: 'none',
        }}>
          {/* Tier */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${tier.border}`,
            borderRadius: 50,
            padding: '6px 14px',
            boxShadow: `0 0 16px ${tier.glow}`,
          }}>
            <span style={{ fontSize: 13 }}>{tier.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: tier.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {tier.label}
            </span>
          </div>

          {/* Right side icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
            {/* Live indicator */}
            {trader.isLive && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,245,160,0.3)',
                borderRadius: 50,
                padding: '6px 12px',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00f5a0',
                  boxShadow: '0 0 8px #00f5a0',
                  animation: 'live-pulse 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: '#00f5a0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Live
                </span>
              </div>
            )}
            
            {/* Heart Button */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite?.(trader);
              }}
              style={{
                width: 32, height: 32, borderRadius: 16,
                background: isFavorite ? 'rgba(255,42,70,0.15)' : 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isFavorite ? 'rgba(255,42,70,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: isFavorite ? '0 0 16px rgba(255,42,70,0.4)' : 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? '#ff2a46' : 'none'} stroke={isFavorite ? '#ff2a46' : 'rgba(255,255,255,0.7)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── ORTA: Profil adı ve adres (arka plan üstünde, fade bölgesinde) ── */}
        <div style={{
          position: 'absolute',
          top: '37%',
          left: 0, right: 0,
          zIndex: 10,
          padding: '0 20px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <a
            href={EXPLORER_ADDR_URL(trader.address)}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: 'monospace',
              fontSize: 16, fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.02em',
              textDecoration: 'none',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {shortenAddress(trader.address)}
          </a>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Monad Testnet
          </span>
        </div>

        {/* ════════════════════════════════
            ÖN PLAN: Trade bilgisi (alt %38)
        ════════════════════════════════ */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '44%',
          background: 'linear-gradient(to bottom, rgba(8,8,18,0.98) 0%, #080810 100%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          zIndex: 5,
          display: 'flex', flexDirection: 'column',
          padding: '14px 20px 14px',
          gap: 10,
        }}>

          {/* ── ROW 1: P&L + Sparkline ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Est. P&L
              </span>
              <span style={{
                fontSize: 32, fontWeight: 900, lineHeight: 1,
                color: profitColor,
                letterSpacing: '-0.03em',
                textShadow: `0 0 24px ${profitColor}80`,
              }}>
                {trader.profit}
              </span>
              {/* Sentiment */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: sentiment.color,
                  background: `${sentiment.color}18`,
                  border: `1px solid ${sentiment.color}40`,
                  borderRadius: 50, padding: '2px 8px',
                }}>
                  {sentiment.icon} {sentiment.label}
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                  {trader.balanceMon} MON
                </span>
              </div>
            </div>
            <Sparkline values={trader.sparkline} positive={isPositive} />
          </div>

          {/* ── ROW 2: Stats chips ── */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Win Rate', value: `${trader.winRate}%`, color: winColor },
              { label: 'Vol 24h',  value: trader.volume24h ?? '—', color: '#7b61ff' },
              { label: 'Txns',     value: (trader.txCount ?? 0).toLocaleString(), color: '#4cc9f0' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '7px 10px',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color, textShadow: `0 0 10px ${color}60` }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── ROW 3: Trade action + token ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {/* Action text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: 13, fontWeight: 900, color: '#ffffff',
                letterSpacing: '-0.01em', textTransform: 'uppercase',
                margin: 0, lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {trader.actionText}
              </h2>
            </div>

            {/* Token pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: `${token.color}15`,
              border: `1px solid ${token.color}40`,
              borderRadius: 20, padding: '5px 10px',
              flexShrink: 0,
            }}>
              <span style={{ color: token.color, fontSize: 12, fontWeight: 900 }}>{token.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: token.color, letterSpacing: '0.08em' }}>
                {trader.tokenSymbol}
              </span>
            </div>
          </div>

          {/* ── ROW 4: Tags ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {trader.tags.slice(0, 4).map((tag) => {
              const t = TAG_COLOR[tag] ?? { c: '#7b61ff', bg: 'rgba(123,97,255,0.1)', border: 'rgba(123,97,255,0.3)' };
              return (
                <span key={tag} style={{
                  background: t.bg, border: `1px solid ${t.border}`,
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 8, fontWeight: 800, color: t.c,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  #{tag}
                </span>
              );
            })}
          </div>

        </div>

      </article>
    </TinderCard>
  );
});

export default SwipeCard;
