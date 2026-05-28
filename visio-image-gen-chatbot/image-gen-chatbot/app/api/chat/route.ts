// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { buildEnhancedSystemPrompt, detectIntent, ConversationMemory } from '@/lib/rag';
import { buildPollinationsUrl, detectImageDimensions, detectModel } from '@/lib/pollinations';

export const runtime = 'edge';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] }: {
      message: string;
      history: ConversationMemory[];
    } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    // NLP: Detect user intent
    const hasRecentImage = history.some(m => m.imageUrl);
    const intent = detectIntent(message, hasRecentImage);

    // RAG: Build context-aware system prompt
    const systemPrompt = buildEnhancedSystemPrompt(message, history);

    // Build conversation messages for Groq
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      // Include recent conversation history (last 10 turns)
      ...history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.imagePrompt
          ? `${m.content} [Generated image with prompt: "${m.imagePrompt}"]`
          : m.content,
      })),
      { role: 'user', content: message },
    ];

    // Call Groq LLM
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    // Try to parse as image generation response
    let imageUrl: string | null = null;
    let imagePrompt: string | null = null;
    let textResponse = rawResponse;

    // Attempt JSON parse for image generation
    const jsonMatch = rawResponse.match(/\{[\s\S]*"type"\s*:\s*"image"[\s\S]*\}/);
    if (jsonMatch || intent === 'generate_image' || intent === 'refine_image') {
      try {
        const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
        const parsed = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());

        if (parsed.type === 'image' && parsed.prompt) {
          imagePrompt = parsed.prompt;
          textResponse = parsed.description || `I'm generating your image now! Here's what I'm creating: *${parsed.prompt}*`;

          // Build Pollinations URL with smart defaults
          const { width, height } = detectImageDimensions(parsed.prompt);
          const model = detectModel(parsed.prompt);

          imageUrl = buildPollinationsUrl({
            prompt: parsed.prompt,
            width,
            height,
            model,
            nologo: true,
            enhance: true,
            apiKey: process.env.POLLINATIONS_API_KEY,
          });
        }
      } catch {
        // Not a JSON response, treat as plain text
        textResponse = rawResponse;
      }
    }

    return NextResponse.json({
      text: textResponse,
      imageUrl,
      imagePrompt,
      intent,
      model: 'llama-3.3-70b-versatile',
    });

  } catch (error: unknown) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key. Check your GROQ_API_KEY environment variable.' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}
