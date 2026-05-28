// lib/rag.ts
// RAG (Retrieval-Augmented Generation) knowledge base
// Stores conversation context + image generation domain knowledge

export interface KnowledgeChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    type: 'system' | 'style' | 'technique' | 'conversation';
    tags: string[];
    timestamp?: number;
  };
}

export interface ConversationMemory {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  timestamp: number;
}

// ──────────────────────────────────────────────
// Static knowledge base for image generation RAG
// ──────────────────────────────────────────────
export const IMAGE_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'styles-1',
    content: 'Photorealistic style: Use keywords like "photorealistic", "8k resolution", "DSLR photo", "hyperrealistic", "raw photo", "sharp focus", "professional photography".',
    metadata: { type: 'style', tags: ['photorealistic', 'photography', 'realistic'] },
  },
  {
    id: 'styles-2',
    content: 'Anime/Manga style: Use keywords like "anime style", "manga art", "Studio Ghibli", "cel shaded", "2D anime", "illustration", "vibrant colors".',
    metadata: { type: 'style', tags: ['anime', 'manga', 'illustration'] },
  },
  {
    id: 'styles-3',
    content: 'Oil painting style: Use keywords like "oil painting", "impressionist", "canvas texture", "painterly", "fine art", "museum quality", "brushstrokes visible".',
    metadata: { type: 'style', tags: ['painting', 'art', 'classical'] },
  },
  {
    id: 'styles-4',
    content: 'Digital art / concept art: Use keywords like "digital art", "concept art", "artstation", "deviantart", "trending on artstation", "matte painting", "illustration".',
    metadata: { type: 'style', tags: ['digital', 'concept', 'modern'] },
  },
  {
    id: 'styles-5',
    content: 'Watercolor style: Use keywords like "watercolor painting", "soft edges", "pastel tones", "watercolor wash", "hand-painted", "gentle gradients".',
    metadata: { type: 'style', tags: ['watercolor', 'soft', 'artistic'] },
  },
  {
    id: 'styles-6',
    content: 'Cyberpunk style: Use keywords like "cyberpunk", "neon lights", "futuristic city", "rain-soaked streets", "holographic displays", "dystopian future", "blade runner".',
    metadata: { type: 'style', tags: ['cyberpunk', 'futuristic', 'neon'] },
  },
  {
    id: 'styles-7',
    content: 'Fantasy style: Use keywords like "fantasy art", "magical", "epic fantasy", "mystical forest", "dragons", "dungeons and dragons", "tolkien-esque".',
    metadata: { type: 'style', tags: ['fantasy', 'magical', 'epic'] },
  },
  {
    id: 'technique-1',
    content: 'Lighting techniques: "golden hour lighting", "dramatic shadows", "rim lighting", "studio lighting", "soft natural light", "chiaroscuro", "volumetric lighting", "god rays".',
    metadata: { type: 'technique', tags: ['lighting', 'shadows', 'atmosphere'] },
  },
  {
    id: 'technique-2',
    content: 'Composition keywords: "rule of thirds", "wide angle shot", "portrait shot", "aerial view", "bird\'s eye view", "close-up", "macro photography", "cinematic shot", "bokeh background".',
    metadata: { type: 'technique', tags: ['composition', 'framing', 'camera'] },
  },
  {
    id: 'technique-3',
    content: 'Quality boosters: Always append "highly detailed", "masterpiece", "best quality", "4k", "intricate details" to improve output quality significantly.',
    metadata: { type: 'technique', tags: ['quality', 'detail', 'resolution'] },
  },
  {
    id: 'technique-4',
    content: 'Negative prompts improve quality by excluding: "blurry, low quality, bad anatomy, watermark, text, signature, deformed, ugly, poorly drawn hands, extra limbs".',
    metadata: { type: 'technique', tags: ['negative', 'quality', 'cleanup'] },
  },
  {
    id: 'system-1',
    content: 'You are an expert AI image generation assistant. You help users create stunning images by understanding their vision and translating it into effective prompts for Pollinations AI. You have deep knowledge of artistic styles, photography techniques, and prompt engineering.',
    metadata: { type: 'system', tags: ['identity', 'role', 'system'] },
  },
];

// ──────────────────────────────────────────────
// Simple cosine-similarity vector search (client-side RAG)
// ──────────────────────────────────────────────
function tokenize(text: string): Map<string, number> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const freq = new Map<string, number>();
  for (const word of words) {
    if (word.length > 2) freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const [word, countA] of a) {
    normA += countA * countA;
    const countB = b.get(word) || 0;
    dot += countA * countB;
  }
  for (const [, countB] of b) normB += countB * countB;
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

export function retrieveRelevantChunks(query: string, topK = 3): KnowledgeChunk[] {
  const queryVec = tokenize(query);
  const scored = IMAGE_KNOWLEDGE_BASE.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryVec, tokenize(chunk.content)),
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(s => s.score > 0)
    .map(s => s.chunk);
}

// ──────────────────────────────────────────────
// NLP: Intent detection
// ──────────────────────────────────────────────
export type Intent =
  | 'generate_image'
  | 'refine_image'
  | 'ask_style'
  | 'ask_technique'
  | 'general_chat'
  | 'greeting';

const IMAGE_INTENT_KEYWORDS = [
  'generate', 'create', 'make', 'draw', 'paint', 'render', 'show me',
  'produce', 'design', 'illustrate', 'imagine', 'visualize', 'picture',
  'image of', 'photo of', 'art of', 'scene of', 'portrait of',
];

const REFINE_KEYWORDS = [
  'change', 'modify', 'update', 'make it', 'more', 'less', 'different',
  'another', 'again', 'redo', 'retry', 'adjust', 'tweak', 'instead',
];

const STYLE_KEYWORDS = ['style', 'aesthetic', 'look', 'feel', 'vibe', 'theme'];
const TECHNIQUE_KEYWORDS = ['technique', 'lighting', 'angle', 'composition', 'shot', 'focus'];
const GREETING_KEYWORDS = ['hello', 'hi', 'hey', 'howdy', 'greetings', 'sup', 'good morning', 'good evening'];

export function detectIntent(message: string, hasRecentImage: boolean): Intent {
  const lower = message.toLowerCase();

  if (GREETING_KEYWORDS.some(k => lower.includes(k)) && lower.length < 30) return 'greeting';
  if (STYLE_KEYWORDS.some(k => lower.includes(k))) return 'ask_style';
  if (TECHNIQUE_KEYWORDS.some(k => lower.includes(k))) return 'ask_technique';
  if (IMAGE_INTENT_KEYWORDS.some(k => lower.includes(k))) return 'generate_image';
  if (hasRecentImage && REFINE_KEYWORDS.some(k => lower.includes(k))) return 'refine_image';

  return 'general_chat';
}

// ──────────────────────────────────────────────
// Prompt enhancer using RAG context
// ──────────────────────────────────────────────
export function buildEnhancedSystemPrompt(
  userMessage: string,
  conversationHistory: ConversationMemory[]
): string {
  const relevantChunks = retrieveRelevantChunks(userMessage, 4);
  const ragContext = relevantChunks.map(c => `• ${c.content}`).join('\n');

  const recentImages = conversationHistory
    .filter(m => m.imagePrompt)
    .slice(-3)
    .map(m => `- "${m.imagePrompt}"`)
    .join('\n');

  return `You are VISIO — an expert AI image generation assistant powered by Groq LLM and Pollinations AI.

## Your Role
You help users create stunning AI-generated images through natural conversation. You understand artistic styles, photography, and prompt engineering deeply.

## Relevant Knowledge (RAG Retrieved)
${ragContext || '• General image generation assistance'}

## Recent Image Context
${recentImages || 'No recent images in this session.'}

## Capabilities
1. **Image Generation**: When users want to create/generate images, respond with JSON containing a refined prompt.
2. **Style Guidance**: Advise on artistic styles, techniques, lighting, composition.
3. **Prompt Refinement**: Help users improve their image descriptions.
4. **Conversation**: Chat naturally about art, creativity, and image generation.

## Response Format
- For IMAGE GENERATION requests, respond ONLY with this JSON (no markdown):
  {"type":"image","prompt":"[enhanced english prompt]","description":"[friendly message to user]"}
  
- For ALL OTHER responses (questions, advice, chat), respond with plain conversational text.

## Prompt Enhancement Rules
- Always enhance prompts with quality boosters: "highly detailed, masterpiece, 8k resolution"
- Add appropriate lighting and atmosphere
- Include relevant style keywords
- Keep prompts in English regardless of user's language
- Make prompts vivid, specific, and descriptive (aim for 30-60 words)

Be warm, creative, and inspiring. Speak naturally and encourage the user's creative vision.`;
}
