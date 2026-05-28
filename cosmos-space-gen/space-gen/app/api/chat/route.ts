// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { buildSystemPrompt, detectIntent, HistoryMessage } from '@/lib/rag';
import { buildImageUrl } from '@/lib/pollinations';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] }: { message: string; history: HistoryMessage[] } = await req.json();

    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const intent = detectIntent(message, history.length > 0);
    const systemPrompt = buildSystemPrompt(message, history);

    const groqMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.imagePrompt ? `${h.content} [prompt: "${h.imagePrompt}"]` : h.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      max_tokens: 512,
      temperature: 0.75,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // Parse image JSON
    let imageUrl: string | null = null;
    let imagePrompt: string | null = null;
    let text = raw;

    const jsonMatch = raw.match(/\{[\s\S]*?"type"\s*:\s*"image"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.type === 'image' && parsed.prompt) {
          imagePrompt = parsed.prompt;
          text = parsed.caption || `Generating: *${parsed.prompt.slice(0, 60)}...*`;
          imageUrl = buildImageUrl(parsed.prompt);
        }
      } catch { /* fallthrough to plain text */ }
    }

    return NextResponse.json({ text, imageUrl, imagePrompt, intent });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
