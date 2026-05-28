// lib/rag.ts — Space-domain RAG knowledge base + NLP intent detection

export interface KnowledgeChunk {
  id: string;
  content: string;
  tags: string[];
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  imagePrompt?: string;
}

// ─────────────────────────────────────────────────────────
// SPACE RAG KNOWLEDGE BASE
// Covers celestial objects, visual styles, lighting, mood
// ─────────────────────────────────────────────────────────
export const SPACE_KNOWLEDGE: KnowledgeChunk[] = [
  // Celestial subjects
  {
    id: 'nebula',
    content: 'Nebulae: vast clouds of gas and dust glowing with ionized particles. Prompt keywords: "emission nebula", "reflection nebula", "planetary nebula", "pillars of creation", "colorful gas clouds", "interstellar dust", "Hubble palette", "star-forming region", "vivid ionized hydrogen".',
    tags: ['nebula', 'cloud', 'gas', 'dust', 'colorful'],
  },
  {
    id: 'galaxy',
    content: 'Galaxies: massive star systems held by gravity. Prompt keywords: "spiral galaxy", "elliptical galaxy", "barred spiral", "galaxy cluster", "Milky Way core", "galactic arms", "cosmic web", "deep field", "interacting galaxies", "galactic collision".',
    tags: ['galaxy', 'milky way', 'spiral', 'stars', 'deep space'],
  },
  {
    id: 'blackhole',
    content: 'Black holes and event horizons: extreme gravity warping spacetime. Prompt keywords: "black hole accretion disk", "event horizon", "gravitational lensing", "singularity", "hawking radiation", "time dilation", "swirling plasma", "photon sphere", "relativistic jets".',
    tags: ['black hole', 'event horizon', 'accretion', 'singularity', 'warp'],
  },
  {
    id: 'planet',
    content: 'Planets and moons: rocky or gaseous worlds. Prompt keywords: "gas giant", "ringed planet", "icy moon", "alien planet", "exoplanet", "planetary rings", "crescent moon", "volcanic surface", "ocean world", "atmospheric storms", "Saturn rings", "Jupiter storms".',
    tags: ['planet', 'moon', 'saturn', 'jupiter', 'mars', 'exoplanet', 'rings'],
  },
  {
    id: 'stars',
    content: 'Stars and stellar phenomena: suns, supernovae, star clusters. Prompt keywords: "supernova remnant", "neutron star", "open star cluster", "globular cluster", "binary star system", "stellar nursery", "red giant", "blue supergiant", "pulsar", "stellar explosion", "cosmic fireworks".',
    tags: ['star', 'supernova', 'cluster', 'pulsar', 'explosion', 'binary'],
  },
  {
    id: 'aurora',
    content: 'Space weather and auroras: energy interacting with magnetic fields. Prompt keywords: "aurora borealis from space", "solar flare", "coronal mass ejection", "solar wind", "magnetosphere", "plasma ribbons", "geomagnetic storm".',
    tags: ['aurora', 'solar', 'flare', 'plasma', 'magnetic'],
  },
  {
    id: 'comet-asteroid',
    content: 'Comets, asteroids and meteor showers: rocky and icy bodies. Prompt keywords: "comet tail", "asteroid belt", "meteor shower", "icy comet", "dust trail", "space rock", "impact crater".',
    tags: ['comet', 'asteroid', 'meteor', 'impact', 'trail'],
  },
  {
    id: 'cosmic-landscape',
    content: 'Cosmic landscapes: wide expansive views of deep space. Prompt keywords: "cosmic panorama", "starfield", "deep space vista", "cosmic horizon", "infinite stars", "space panorama", "universe wide angle".',
    tags: ['landscape', 'panorama', 'starfield', 'wide', 'vista', 'deep'],
  },

  // Visual styles
  {
    id: 'style-realistic',
    content: 'Photorealistic space style: "NASA photograph", "Hubble Space Telescope image", "James Webb infrared", "photorealistic render", "scientifically accurate", "astrophotography", "long exposure photograph".',
    tags: ['realistic', 'nasa', 'hubble', 'photo', 'accurate'],
  },
  {
    id: 'style-artistic',
    content: 'Artistic space style: "digital painting", "space art", "sci-fi concept art", "cinematic space scene", "epic space illustration", "artstation trending", "matte painting", "space oil painting".',
    tags: ['art', 'painting', 'illustration', 'concept', 'cinematic'],
  },
  {
    id: 'style-dramatic',
    content: 'Dramatic lighting for space: "volumetric light beams", "god rays through nebula", "rim lighting from star", "dramatic silhouette", "high contrast", "chiaroscuro space scene", "spotlight on planet".',
    tags: ['dramatic', 'lighting', 'contrast', 'volumetric', 'silhouette'],
  },

  // Quality boosters
  {
    id: 'quality',
    content: 'Always append for quality: "highly detailed, 8k resolution, masterpiece, intricate details, sharp focus, stunning, breathtaking, award-winning astronomy photography".',
    tags: ['quality', 'detail', 'resolution', '8k', 'masterpiece'],
  },
];

// ─────────────────────────────────────────────────────────
// Simple TF-IDF cosine similarity retriever
// ─────────────────────────────────────────────────────────
function tokenize(text: string): Map<string, number> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const freq = new Map<string, number>();
  for (const w of words) if (w.length > 2) freq.set(w, (freq.get(w) || 0) + 1);
  return freq;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [w, ca] of a) { na += ca * ca; dot += ca * (b.get(w) || 0); }
  for (const [, cb] of b) nb += cb * cb;
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export function retrieveChunks(query: string, topK = 4): KnowledgeChunk[] {
  const qVec = tokenize(query);
  return SPACE_KNOWLEDGE
    .map(c => ({ c, score: cosine(qVec, tokenize(c.content + ' ' + c.tags.join(' '))) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(x => x.score > 0)
    .map(x => x.c);
}

// ─────────────────────────────────────────────────────────
// NLP — Intent detection
// ─────────────────────────────────────────────────────────
export type Intent = 'generate' | 'refine' | 'question' | 'greeting' | 'other';

const GEN_WORDS = ['generate', 'create', 'make', 'draw', 'show', 'render', 'paint', 'picture', 'image', 'photo', 'visualize', 'produce', 'imagine'];
const REFINE_WORDS = ['again', 'redo', 'retry', 'different', 'more', 'change', 'another', 'modify', 'update', 'vary', 'instead', 'brighter', 'darker'];
const GREET_WORDS = ['hello', 'hi', 'hey', 'greetings', 'sup', 'good morning', 'good evening', 'howdy'];

export function detectIntent(msg: string, hasHistory: boolean): Intent {
  const l = msg.toLowerCase();
  if (GREET_WORDS.some(w => l.includes(w)) && l.length < 25) return 'greeting';
  if (GEN_WORDS.some(w => l.includes(w))) return 'generate';
  if (hasHistory && REFINE_WORDS.some(w => l.includes(w))) return 'refine';
  if (l.includes('?') || l.startsWith('what') || l.startsWith('how') || l.startsWith('why')) return 'question';
  // Short noun phrases like "a nebula" or "saturn" likely mean generate
  if (l.split(' ').length <= 6 && !l.includes('?')) return 'generate';
  return 'other';
}

// ─────────────────────────────────────────────────────────
// Build system prompt with RAG context injected
// ─────────────────────────────────────────────────────────
export function buildSystemPrompt(userMsg: string, history: HistoryMessage[]): string {
  const chunks = retrieveChunks(userMsg, 4);
  const ragContext = chunks.map(c => `• ${c.content}`).join('\n');
  const recentPrompts = history.filter(h => h.imagePrompt).slice(-3).map(h => `- "${h.imagePrompt}"`).join('\n');

  return `You are COSMOS — a focused AI assistant that generates images of space, galaxies, nebulae, and celestial objects using Pollinations AI.

## Domain
You ONLY generate space, galaxy, nebula, planet, star, black hole, and cosmic imagery. If asked about unrelated topics, gently redirect to space.

## Retrieved Space Knowledge (RAG)
${ragContext || '• General space and astronomy imagery'}

## Recent Prompts This Session
${recentPrompts || 'None yet.'}

## Response Rules
**For image generation requests**, respond ONLY with this exact JSON (no markdown, no extra text):
{"type":"image","prompt":"[enhanced space prompt in English]","caption":"[1 short sentence description for user]"}

**For questions or chat**, respond with plain conversational text (1-3 sentences max). Be concise.

## Prompt Enhancement Rules
- Always write prompts in English regardless of user's language
- Add: "highly detailed, 8k resolution, masterpiece, stunning astronomy"
- Include specific visual style (Hubble photo / digital painting / cinematic)
- Include lighting (volumetric light, star glow, nebula illumination)
- Keep prompts 25-50 words — vivid and specific
- For refine requests, vary the seed/composition while keeping the subject

You are minimal, focused, and precise. No lengthy explanations. Just cosmic imagery.`;
}
