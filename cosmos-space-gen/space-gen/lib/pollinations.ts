// lib/pollinations.ts — Space image generation via Pollinations AI

export function buildImageUrl(prompt: string, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 999999);

  // Space images look best wide (16:9-ish) or square
  const isPortrait = /planet|moon|astronaut|portrait|person|character/i.test(prompt);
  const width  = isPortrait ? 896  : 1344;
  const height = isPortrait ? 1152 : 768;

  // Pick model based on content
  let model = 'flux';
  if (/realistic|photo|nasa|hubble|james webb|astrophoto/i.test(prompt)) model = 'flux-realism';
  if (/3d|render|cgi|blender|octane/i.test(prompt)) model = 'flux-3d';

  const params = new URLSearchParams({
    width:   width.toString(),
    height:  height.toString(),
    seed:    s.toString(),
    model,
    nologo:  'true',
    enhance: 'true',
  });

  if (process.env.POLLINATIONS_API_KEY) {
    params.set('token', process.env.POLLINATIONS_API_KEY);
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}
