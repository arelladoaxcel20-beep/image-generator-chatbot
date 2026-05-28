'use client';
// app/page.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, Download, RefreshCw, Image as ImageIcon,
  Zap, MessageSquare, ChevronDown, Copy, Check, Wand2,
  Github, Info
} from 'lucide-react';
import { ConversationMemory, detectIntent } from '@/lib/rag';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  intent?: string;
  timestamp: number;
  isLoading?: boolean;
}

const QUICK_PROMPTS = [
  'A neon-lit cyberpunk city at night with rain reflections',
  'Ethereal fantasy forest with glowing mushrooms and fairies',
  'Minimalist Japanese temple surrounded by cherry blossoms',
  'Astronaut floating in a colorful nebula, oil painting style',
  'A cozy coffee shop interior during golden hour',
  'Surreal melting clocks in a desert landscape, Dalí style',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Welcome to **VISIO** — your AI image creation studio.

I combine **Groq's LLM** for intelligent conversation with **Pollinations AI** for stunning image generation. Just describe what you want to see, and I'll bring it to life.

*Try something like:* "Create a mystical forest with glowing trees and a hidden waterfall"`,
  timestamp: Date.now(),
};

// ──────────────────────────────────────────────
// Utility: Format message content
// ──────────────────────────────────────────────
function formatContent(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}

// ──────────────────────────────────────────────
// ImageCard Component
// ──────────────────────────────────────────────
function ImageCard({ url, prompt, onRegenerate }: {
  url: string;
  prompt: string;
  onRegenerate: (prompt: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `visio-${Date.now()}.png`;
      a.click();
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-2xl overflow-hidden glass gradient-border group">
      {/* Image */}
      <div className="relative bg-ghost/50 aspect-square max-w-sm">
        {!loaded && !error && (
          <div className="absolute inset-0 shimmer flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-neon animate-pulse-slow" />
            <p className="text-xs text-muted font-mono">Rendering your vision...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageIcon className="w-8 h-8 text-muted" />
            <p className="text-xs text-muted">Image failed to load. Try regenerating.</p>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={prompt}
          className={`w-full h-full object-cover transition-all duration-700 ${loaded ? 'opacity-100 img-reveal' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          loading="lazy"
        />

        {/* Overlay controls */}
        {loaded && !error && (
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs text-pulse hover:text-neon transition-colors btn-lift"
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={() => onRegenerate(prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs text-pulse hover:text-glow transition-colors btn-lift"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Prompt info */}
      <div className="p-3 flex items-start justify-between gap-2">
        <p className="text-xs text-muted font-mono line-clamp-2 flex-1">{prompt}</p>
        <button
          onClick={handleCopyPrompt}
          className="shrink-0 p-1.5 rounded-lg hover:bg-neon/10 text-muted hover:text-neon transition-colors"
          title="Copy prompt"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// TypingIndicator
// ──────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 msg-enter">
      <div className="w-8 h-8 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-neon animate-pulse-slow" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-neon typing-dot" />
        <div className="w-1.5 h-1.5 rounded-full bg-neon typing-dot" />
        <div className="w-1.5 h-1.5 rounded-full bg-neon typing-dot" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const buildHistory = (): ConversationMemory[] => {
    return messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role,
        content: m.content,
        imageUrl: m.imageUrl,
        imagePrompt: m.imagePrompt,
        timestamp: m.timestamp,
      }));
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setShowQuickPrompts(false);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Add loading placeholder
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: Date.now(),
    }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: buildHistory(),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const data = await res.json();

      setMessages(prev => prev.map(m =>
        m.id === loadingId ? {
          id: `a-${Date.now()}`,
          role: 'assistant' as const,
          content: data.text,
          imageUrl: data.imageUrl,
          imagePrompt: data.imagePrompt,
          intent: data.intent,
          timestamp: Date.now(),
          isLoading: false,
        } : m
      ));

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      setMessages(prev => prev.map(m =>
        m.id === loadingId ? {
          id: `err-${Date.now()}`,
          role: 'assistant' as const,
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          timestamp: Date.now(),
          isLoading: false,
        } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const regenerate = (prompt: string) => {
    sendMessage(`Regenerate this image with slight variations: ${prompt}`);
  };

  const imageCount = messages.filter(m => m.imageUrl).length;

  return (
    <div className="mesh-bg noise h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon/30 to-spark/20 border border-neon/30 flex items-center justify-center glow-neon">
              <Sparkles className="w-5 h-5 text-neon" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-lg tracking-widest text-pulse glow-text">VISIO</h1>
            <p className="text-xs text-muted">AI Image Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {imageCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-neon">
              <ImageIcon className="w-3.5 h-3.5" />
              {imageCount} image{imageCount !== 1 ? 's' : ''}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-muted">
            <Zap className="w-3.5 h-3.5 text-spark" />
            <span className="hidden sm:inline">Groq</span>
            <span className="text-[var(--c-border-hover)]">×</span>
            <span className="hidden sm:inline">Pollinations</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-neon/10 text-muted hover:text-neon transition-colors"
            title="View on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 msg-enter ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                msg.role === 'user'
                  ? 'bg-spark/20 border-spark/30'
                  : 'bg-neon/20 border-neon/30'
              }`}>
                {msg.role === 'user'
                  ? <MessageSquare className="w-4 h-4 text-spark" />
                  : <Sparkles className="w-4 h-4 text-neon" />
                }
              </div>

              {/* Content */}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {msg.isLoading ? (
                  <TypingIndicator />
                ) : (
                  <>
                    {msg.content && (
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed prose-visio ${
                        msg.role === 'user'
                          ? 'glass bg-spark/5 border-spark/20 rounded-tr-sm text-pulse'
                          : 'glass rounded-tl-sm text-pulse'
                      }`}>
                        <span dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                      </div>
                    )}

                    {msg.imageUrl && (
                      <ImageCard
                        url={msg.imageUrl}
                        prompt={msg.imagePrompt || ''}
                        onRegenerate={regenerate}
                      />
                    )}

                    {msg.intent && msg.intent !== 'general_chat' && msg.intent !== 'greeting' && (
                      <span className="text-xs text-muted/50 font-mono px-1">
                        {msg.intent.replace(/_/g, ' ')}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick prompts */}
      {showQuickPrompts && messages.length === 1 && (
        <div className="shrink-0 px-4 pb-2">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-muted mb-2 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              Quick start ideas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs glass glass-hover px-3 py-1.5 rounded-full text-muted hover:text-pulse transition-all btn-lift border-[var(--c-border)] hover:border-neon/30"
                >
                  {prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 px-4 pb-5 pt-3">
        <div className="max-w-2xl mx-auto">
          <div className="glass gradient-border rounded-2xl p-3 flex items-end gap-3">
            <Wand2 className="w-4 h-4 text-neon/50 mb-2.5 shrink-0" />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe an image or ask me anything..."
              className="flex-1 bg-transparent text-pulse placeholder-muted/40 text-sm resize-none outline-none font-body leading-relaxed"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all btn-lift ${
                input.trim() && !isLoading
                  ? 'bg-neon/20 border border-neon/40 text-neon hover:bg-neon/30 glow-neon'
                  : 'bg-ghost border border-[var(--c-border)] text-muted/30 cursor-not-allowed'
              }`}
            >
              {isLoading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          <p className="text-center text-xs text-muted/30 mt-2">
            Powered by Groq LLaMA 3.3 · Pollinations AI · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
