'use client';
// app/page.tsx — COSMOS Space Image Generator

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Star, Download, RefreshCw, Copy, Check, Telescope } from 'lucide-react';
import { HistoryMessage } from '@/lib/rag';

// ── Types ────────────────────────────────────────────────
interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  loading?: boolean;
}

// ── Quick prompts ─────────────────────────────────────────
const QUICK = [
  'Andromeda galaxy close-up',
  'Eagle Nebula pillars of creation',
  'Black hole accretion disk',
  'Saturn with its rings',
  'Supernova explosion',
  'Milky Way core panorama',
  'Icy moon with volcanoes',
  'Deep space star cluster',
];

const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to **COSMOS** — your space image generator. Describe any celestial object, galaxy, or cosmic scene and I\'ll generate it instantly. Try *"a swirling nebula with newborn stars"* or pick a quick start below.',
};

// ── Starfield canvas ──────────────────────────────────────
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      o: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.0003 + 0.0001,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.016;
      for (const s of stars) {
        const opacity = s.o * (0.7 + 0.3 * Math.sin(t * s.speed * 60 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191, 219, 254, ${opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} id="starfield" />;
}

// ── Image card ─────────────────────────────────────────────
function ImageCard({ url, prompt, onRegenerate }: { url: string; prompt: string; onRegenerate: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr]    = useState(false);
  const [copied, setCopied] = useState(false);

  const download = async () => {
    try {
      const blob = await fetch(url).then(r => r.blob());
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cosmos-${Date.now()}.png`;
      a.click();
    } catch { window.open(url, '_blank'); }
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="img-card" style={{ marginTop: 10 }}>
      {/* Loading shimmer */}
      {!loaded && !err && (
        <div className="shimmer-box">
          <Star size={22} color="var(--accent)" style={{ opacity: 0.6 }} />
          <span className="shimmer-label">Rendering cosmos…</span>
        </div>
      )}
      {err && (
        <div className="shimmer-box">
          <span className="shimmer-label">Failed to load — try regenerating</span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url} alt={prompt}
        style={{ display: loaded && !err ? 'block' : 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => { setErr(true); setLoaded(true); }}
        loading="lazy"
      />
      <div className="img-card-footer">
        <span className="img-prompt-text">{prompt}</span>
        <div className="img-actions">
          <button className="icon-btn" title="Copy prompt" onClick={copyPrompt}>
            {copied ? <Check size={13} color="var(--accent)" /> : <Copy size={13} />}
          </button>
          <button className="icon-btn" title="Regenerate" onClick={onRegenerate}>
            <RefreshCw size={13} />
          </button>
          <button className="icon-btn" title="Download" onClick={download}>
            <Download size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Format bubble text ────────────────────────────────────
function fmt(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

// ── Main page ─────────────────────────────────────────────
export default function Page() {
  const [msgs,    setMsgs]    = useState<Msg[]>([WELCOME]);
  const [input,   setInput]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [showQ,   setShowQ]   = useState(true);
  const endRef    = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);

  const scroll = useCallback(() =>
    endRef.current?.scrollIntoView({ behavior: 'smooth' }), []);

  useEffect(() => { scroll(); }, [msgs, scroll]);

  const history = (): HistoryMessage[] =>
    msgs.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role, content: m.content, imagePrompt: m.imagePrompt,
    }));

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setShowQ(false);

    const uid = `u-${Date.now()}`;
    const lid = `l-${Date.now()}`;

    setMsgs(p => [
      ...p,
      { id: uid, role: 'user', content: text.trim() },
      { id: lid, role: 'assistant', content: '', loading: true },
    ]);
    setInput('');
    setBusy(true);

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: history() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setMsgs(p => p.map(m => m.id === lid
        ? { id: `a-${Date.now()}`, role: 'assistant', content: data.text, imageUrl: data.imageUrl, imagePrompt: data.imagePrompt, loading: false }
        : m));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error — please try again.';
      setMsgs(p => p.map(m => m.id === lid
        ? { id: `err-${Date.now()}`, role: 'assistant', content: msg, loading: false }
        : m));
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const regenerate = (prompt: string) => send(`Regenerate with variation: ${prompt}`);

  return (
    <>
      <Starfield />

      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <Telescope size={18} color="var(--white)" />
            </div>
            <div>
              <div className="logo-title">COSMOS</div>
              <div className="logo-sub">Space Image Generator</div>
            </div>
          </div>
          <div className="header-badge">
            <div className="dot" />
            Groq · Pollinations AI
          </div>
        </header>

        {/* Messages */}
        <main className="messages">
          <div className="messages-inner">
            {msgs.map(m => (
              <div key={m.id} className={`msg-row ${m.role}`}>
                {/* Avatar */}
                <div className={`avatar ${m.role === 'user' ? 'user' : 'bot'}`}>
                  {m.role === 'user' ? '✦' : '✺'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: '80%' }}>
                  {/* Bubble */}
                  {m.loading ? (
                    <div className={`bubble bot`}>
                      <div className="typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  ) : m.content ? (
                    <div className={`bubble ${m.role}`}
                      dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                  ) : null}

                  {/* Image */}
                  {m.imageUrl && m.imagePrompt && (
                    <ImageCard
                      url={m.imageUrl}
                      prompt={m.imagePrompt}
                      onRegenerate={() => regenerate(m.imagePrompt!)}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </main>

        {/* Quick prompts */}
        {showQ && msgs.length === 1 && (
          <div className="quick-section">
            <div className="quick-inner">
              <div className="quick-label">✦ Quick start</div>
              <div className="quick-chips">
                {QUICK.map(q => (
                  <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-inner">
            <div className="input-box">
              <textarea
                ref={taRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Describe a galaxy, nebula, planet, or cosmic scene…"
                rows={1}
                disabled={busy}
              />
              <button
                className="send-btn"
                onClick={() => send(input)}
                disabled={!input.trim() || busy}
                title="Send"
              >
                {busy ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              </button>
            </div>
            <p className="input-hint">Enter to send · Shift+Enter for new line · Powered by Groq LLaMA 3.3 + Pollinations AI</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
