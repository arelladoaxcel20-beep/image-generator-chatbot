// lib/pollinations.ts
// Pollinations AI image generation utilities

export interface ImageGenOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
  nologo?: boolean;
  enhance?: boolean;
  apiKey?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  width: number;
  height: number;
  seed: number;
  model: string;
}

// Available Pollinations models
export const POLLINATIONS_MODELS = {
  FLUX: 'flux',
  FLUX_REALISM: 'flux-realism',
  FLUX_ANIME: 'flux-anime',
  FLUX_3D: 'flux-3d',
  TURBO: 'turbo',
} as const;

export type PollinationsModel = typeof POLLINATIONS_MODELS[keyof typeof POLLINATIONS_MODELS];

export function buildPollinationsUrl(options: ImageGenOptions): string {
  const {
    prompt,
    width = 1024,
    height = 1024,
    model = POLLINATIONS_MODELS.FLUX,
    seed,
    nologo = true,
    enhance = true,
    apiKey,
  } = options;

  const encodedPrompt = encodeURIComponent(prompt);
  const randomSeed = seed ?? Math.floor(Math.random() * 999999);

  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    seed: randomSeed.toString(),
    model,
    nologo: nologo.toString(),
    enhance: enhance.toString(),
  });

  // Add API key if available for authenticated access
  if (apiKey) {
    params.set('token', apiKey);
  }

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
}

export function detectImageDimensions(prompt: string): { width: number; height: number } {
  const lower = prompt.toLowerCase();

  // Portrait detection
  if (lower.includes('portrait') || lower.includes('person') || lower.includes('face') ||
      lower.includes('character') || lower.includes('selfie')) {
    return { width: 832, height: 1216 };
  }

  // Landscape detection
  if (lower.includes('landscape') || lower.includes('panorama') || lower.includes('wide') ||
      lower.includes('cityscape') || lower.includes('horizon') || lower.includes('scenery')) {
    return { width: 1344, height: 768 };
  }

  // Wallpaper / desktop
  if (lower.includes('wallpaper') || lower.includes('desktop') || lower.includes('widescreen')) {
    return { width: 1920, height: 1080 };
  }

  // Default square
  return { width: 1024, height: 1024 };
}

export function detectModel(prompt: string): PollinationsModel {
  const lower = prompt.toLowerCase();

  if (lower.includes('anime') || lower.includes('manga') || lower.includes('cartoon') ||
      lower.includes('ghibli') || lower.includes('cel shad')) {
    return POLLINATIONS_MODELS.FLUX_ANIME;
  }

  if (lower.includes('3d') || lower.includes('render') || lower.includes('cgi') ||
      lower.includes('blender') || lower.includes('unreal engine') || lower.includes('octane')) {
    return POLLINATIONS_MODELS.FLUX_3D;
  }

  if (lower.includes('photo') || lower.includes('realistic') || lower.includes('real') ||
      lower.includes('dslr') || lower.includes('photography')) {
    return POLLINATIONS_MODELS.FLUX_REALISM;
  }

  return POLLINATIONS_MODELS.FLUX;
}
