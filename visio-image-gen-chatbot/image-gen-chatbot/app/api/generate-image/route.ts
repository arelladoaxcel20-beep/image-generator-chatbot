// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildPollinationsUrl, detectImageDimensions, detectModel } from '@/lib/pollinations';

export async function POST(req: NextRequest) {
  try {
    const { prompt, width, height, model, seed } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const dims = width && height ? { width, height } : detectImageDimensions(prompt);
    const selectedModel = model || detectModel(prompt);

    const imageUrl = buildPollinationsUrl({
      prompt,
      ...dims,
      model: selectedModel,
      seed,
      nologo: true,
      enhance: true,
      apiKey: process.env.POLLINATIONS_API_KEY,
    });

    return NextResponse.json({
      imageUrl,
      prompt,
      model: selectedModel,
      ...dims,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image URL' },
      { status: 500 }
    );
  }
}
