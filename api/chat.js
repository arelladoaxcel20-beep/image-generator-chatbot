// api/chat.js — Vercel Serverless Function
// Env vars needed in Vercel dashboard:
//   GROQ_API_KEY   — your Groq key
//   (Pollinations is free, no key needed)

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are COSMOS, an expert AI assistant specializing in space, astronomy, astrophysics, galaxies, nebulae, celestial objects, and cosmic phenomena.

When a user asks for an image or describes a space scene, you MUST:
1. Reply with a vivid, enthusiastic description of the scene (2-3 sentences max).
2. End your reply with exactly this line (no extra text after it):
   IMAGE_PROMPT: <detailed, comma-separated image generation prompt starting with "ultra-detailed space photography,">

The IMAGE_PROMPT must be rich and descriptive, mentioning: lighting, colors, style (cinematic, photorealistic, 8K), atmosphere, and specific celestial elements.

Example:
USER: Show me a nebula
ASSISTANT: The Orion Nebula blazes in shades of crimson and gold — a stellar nursery where infant stars ignite for the first time. Pillars of cosmic dust stretch across light-years, sculpted by stellar winds into cathedral-like formations.
IMAGE_PROMPT: ultra-detailed space photography, Orion nebula, crimson and gold gas clouds, glowing stellar nursery, newborn stars, dust pillars, deep space, 8K cinematic, photorealistic, Hubble style, volumetric lighting

If the user is just chatting (no image request), reply helpfully about space topics without IMAGE_PROMPT.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { message, history = [] } = body;

  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing message field' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured in Vercel environment variables.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build message history (keep last 10 turns to stay within context)
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter(m => m.role && m.content)
    .slice(-10);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...safeHistory,
    { role: 'user', content: message }
  ];

  // ── Call Groq ──
  let groqRes, groqData;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages,
        max_tokens: 512,
        temperature: 0.85
      })
    });
    groqData = await groqRes.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: `Groq request failed: ${err.message}` }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!groqRes.ok) {
    const errMsg = groqData?.error?.message || 'Groq API error';
    return new Response(JSON.stringify({ error: errMsg }), {
      status: groqRes.status, headers: { 'Content-Type': 'application/json' }
    });
  }

  const rawText = groqData?.choices?.[0]?.message?.content || '';

  // ── Extract IMAGE_PROMPT if present ──
  const imageMatch = rawText.match(/IMAGE_PROMPT:\s*(.+)/i);
  let imagePrompt = null;
  let imageUrl = null;
  let displayText = rawText;

  if (imageMatch) {
    imagePrompt = imageMatch[1].trim();
    // Strip the IMAGE_PROMPT line from display text
    displayText = rawText.replace(/IMAGE_PROMPT:.*/is, '').trim();

    // ── Build Pollinations URL ──
    // Free, no API key needed. Uses their image generation endpoint.
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const seed = Math.floor(Math.random() * 999999);
    imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=512&seed=${seed}&nologo=true&model=flux`;
  }

  return new Response(
    JSON.stringify({
      text: displayText || 'Here is your cosmic scene!',
      imageUrl,
      imagePrompt
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
