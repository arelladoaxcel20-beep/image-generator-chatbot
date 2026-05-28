# COSMOS — Space Image Generator

A focused AI chatbot that generates stunning images of **galaxies, nebulae, planets, black holes, and celestial objects** through natural conversation.

**Stack:** Next.js 14 · Groq LLaMA 3.3 · Pollinations AI · NLP + RAG

---

## Deploy in 3 Steps

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/cosmos-space-gen.git
git push -u origin main
```

### 2. Deploy on Vercel
Go to [vercel.com](https://vercel.com) → **New Project** → import your repo → **Deploy**

### 3. Add Environment Variables
Vercel Dashboard → **Project → Settings → Environment Variables**

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — free |
| `POLLINATIONS_API_KEY` | [pollinations.ai](https://pollinations.ai) — optional |

Redeploy after adding keys. Done! 🚀

---

## Local Development
```bash
cp .env.example .env.local   # add your keys
npm install
npm run dev                   # http://localhost:3000
```

---

## How It Works

```
User types "show me a nebula"
       ↓
NLP intent detection  →  generate
       ↓
RAG retrieval  →  top 4 nebula knowledge chunks injected into system prompt
       ↓
Groq LLaMA 3.3 70B  →  returns JSON { type: "image", prompt: "...", caption: "..." }
       ↓
Pollinations AI  →  URL built with auto-selected model + dimensions
       ↓
Image rendered in chat with download / regenerate / copy options
```

**RAG Knowledge Base** (`lib/rag.ts`) contains expertise on:
- Nebulae, galaxies, black holes, planets, stars, comets
- Visual styles (Hubble-realistic, cinematic, digital painting)
- Lighting and composition techniques
- Quality prompt boosters

**NLP** detects intent: `generate` / `refine` / `question` / `greeting`

**Pollinations model auto-selection:**
- `flux-realism` for photo/NASA/Hubble style
- `flux-3d` for 3D/CGI renders
- `flux` (default) for everything else

---

## Project Structure
```
app/
  api/chat/route.ts     ← Groq + RAG endpoint (Edge runtime)
  page.tsx              ← Chat UI with starfield
  globals.css           ← Dark blue design system
  layout.tsx            ← Fonts & metadata
lib/
  rag.ts                ← Knowledge base + cosine retrieval + NLP
  pollinations.ts       ← Image URL builder
```
