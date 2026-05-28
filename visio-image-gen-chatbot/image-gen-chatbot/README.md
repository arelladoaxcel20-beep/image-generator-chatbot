# VISIO — AI Image Generator Chatbot

A stunning AI-powered image generation chatbot built with **Next.js 14**, **Groq LLM**, and **Pollinations AI**. Features NLP intent detection, RAG (Retrieval-Augmented Generation) for context-aware responses, and a beautiful dark UI.

![VISIO Preview](https://image.pollinations.ai/prompt/futuristic%20AI%20image%20generation%20chatbot%20interface%20dark%20neon%20aesthetic?width=1200&height=630&nologo=true)

---

## ✨ Features

- 🧠 **Groq LLM** (LLaMA 3.3 70B) for intelligent, fast text generation
- 🎨 **Pollinations AI** for high-quality image generation (no API limit!)
- 🔍 **NLP Intent Detection** — understands when you want images vs chat
- 📚 **RAG System** — retrieves relevant style/technique knowledge for better prompts
- 🖼️ **Smart Prompt Enhancement** — automatically adds quality keywords
- 🔄 **Conversation Memory** — remembers context across messages
- 📐 **Auto Dimension Detection** — portrait, landscape, or square based on content
- 🎭 **Model Selection** — auto-picks Flux, Flux-Realism, Flux-Anime, or Flux-3D
- 💾 **Image Download** — save generated images directly
- ⚡ **Edge Runtime** — ultra-fast API responses via Vercel Edge

---

## 🚀 Deploy to Vercel (Recommended)

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/image-gen-chatbot.git
cd image-gen-chatbot
```

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/image-gen-chatbot.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Vercel auto-detects Next.js — click **Deploy**

### 4. Set Environment Variables
In Vercel Dashboard → **Project** → **Settings** → **Environment Variables**:

| Variable | Value | Required |
|---|---|---|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes |
| `POLLINATIONS_API_KEY` | Your Pollinations API key | ⚡ Optional |

> **Get your keys:**
> - Groq: [console.groq.com/keys](https://console.groq.com/keys) (free)
> - Pollinations: [pollinations.ai](https://pollinations.ai) (optional, for authenticated access)

### 5. Redeploy
After adding env vars, trigger a new deployment from the Vercel dashboard.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local and add your API keys

# Run dev server
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Project Structure

```
image-gen-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Groq LLM + RAG endpoint
│   │   └── generate-image/route.ts # Pollinations URL builder
│   ├── globals.css                 # Custom animations & design system
│   ├── layout.tsx                  # Root layout with fonts
│   └── page.tsx                    # Main chat UI
├── lib/
│   ├── rag.ts                      # RAG knowledge base + NLP
│   └── pollinations.ts             # Image generation utilities
├── .env.example                    # Environment variable template
├── vercel.json                     # Vercel deployment config
└── README.md
```

---

## 🧠 How It Works (NLP + RAG + LLM)

### 1. NLP Intent Detection
Every user message is analyzed for intent:
- `generate_image` — user wants to create an image
- `refine_image` — user wants to modify a recent image
- `ask_style` — asking about art styles
- `ask_technique` — asking about techniques
- `general_chat` — normal conversation

### 2. RAG (Retrieval-Augmented Generation)
The system has a knowledge base of image generation expertise:
- Art styles (photorealistic, anime, cyberpunk, fantasy, etc.)
- Techniques (lighting, composition, camera angles)
- Quality boosters and negative prompts

When you send a message, the top relevant knowledge chunks are retrieved using **cosine similarity** and injected into the LLM's system prompt.

### 3. LLM Processing (Groq)
Groq's LLaMA 3.3 70B processes your message with:
- The RAG-enhanced system prompt
- Full conversation history
- Intent context

For image requests, the LLM returns structured JSON with an enhanced prompt.

### 4. Image Generation (Pollinations)
The enhanced prompt is sent to Pollinations AI with:
- **Auto model selection**: Flux / Flux-Realism / Flux-Anime / Flux-3D
- **Auto dimensions**: Portrait (832×1216) / Landscape (1344×768) / Square (1024×1024)
- **Quality enhancement** enabled

---

## 🎨 Image Examples

Try these prompts:
- *"A neon cyberpunk city at night with rain reflections"*
- *"Watercolor painting of a Japanese cherry blossom garden"*
- *"Realistic portrait of a warrior in medieval armor, dramatic lighting"*
- *"Anime style magical forest with glowing spirits and fireflies"*

---

## 🔧 Customization

### Change the LLM Model
In `app/api/chat/route.ts`, update the model:
```typescript
model: 'llama-3.3-70b-versatile'
// Other options: 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'
```

### Add Knowledge to RAG
In `lib/rag.ts`, add to `IMAGE_KNOWLEDGE_BASE`:
```typescript
{
  id: 'custom-1',
  content: 'Your custom knowledge here...',
  metadata: { type: 'style', tags: ['custom'] },
}
```

### Default Image Size
In `lib/pollinations.ts`, adjust `detectImageDimensions()`.

---

## 📄 License

MIT — free for personal and commercial use.

---

Built with ❤️ using Next.js 14, Groq, and Pollinations AI.
