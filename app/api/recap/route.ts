import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
const getOpenAI = () => {
    if (!_openai) {
        _openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY!,
        });
    }
    return _openai;
};

export async function POST(req: NextRequest) {
    const { transcript, topic, name, userName } = await req.json();

    const prompt = transcript
        ? `You are ${name}, a voice tutor. Below is the full transcript of a tutoring session on "${topic}" with student ${userName}.\n\nTranscript:\n${transcript}\n\nWrite a natural, warm, spoken recap that you will deliver out loud. Cover:\n1. The main topics and concepts discussed\n2. The 2-3 most important things the student should remember\n3. One specific suggestion for what to study or practise next\n4. A brief encouraging closing line\n\nWrite ONLY the spoken text, no lists, no markdown, no headers. Write it as flowing, natural speech — exactly as you would say it. Aim for 150-200 words.`
        : `You are ${name}, a voice tutor. A tutoring session on "${topic}" with student ${userName} just ended but no transcript was recorded. Deliver a short, warm, encouraging closing message that reviews common key points for this topic and encourages the student to keep studying. 80-100 words, spoken naturally.`;

    try {
        const completion = await getOpenAI().chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 350,
            temperature: 0.7,
        });

        const recap = completion.choices[0]?.message?.content?.trim()
            || `Great session on ${topic} today! We covered the key concepts and you did a fantastic job engaging with the material. Make sure to review your notes and keep practising. See you next time!`;

        return NextResponse.json({ recap });
    } catch (err) {
        console.error('[recap] OpenRouter error', err);
        return NextResponse.json(
            { recap: `Great session on ${topic} today! Keep reviewing what we covered and don't hesitate to come back for more. You're doing great!` },
            { status: 200 }
        );
    }
}
