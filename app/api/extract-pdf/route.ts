import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Increase allowed execution time for heavy PDF processing
export const maxDuration = 60;

// Tell Next.js not to apply any body-size limit on this route handler.
// (The serverActions.bodySizeLimit in next.config only covers Server Actions.)
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Chunking helpers
// ---------------------------------------------------------------------------
interface TextChunk {
  text: string;
  index: number;
  wordCount: number;
}

function splitIntoChunks(
  text: string,
  wordsPerChunk = 500,
  overlapWords = 50
): TextChunk[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;
  let startIndex = 0;

  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
    const chunkWords = words.slice(startIndex, endIndex);
    chunks.push({
      text: chunkWords.join(" "),
      index: chunkIndex,
      wordCount: chunkWords.length,
    });
    chunkIndex++;
    if (endIndex >= words.length) break;
    startIndex = endIndex - overlapWords;
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Lazy clients — instantiated on first request, NOT at module evaluation time.
// This prevents Vercel build failures when env vars are absent during `next build`.
// ---------------------------------------------------------------------------
let _openai: OpenAI | null = null;
const getOpenAI = (): OpenAI => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return _openai;
};

let _embeddingClient: OpenAI | null | undefined = undefined;
const getEmbeddingClient = (): OpenAI | null => {
  if (_embeddingClient === undefined) {
    _embeddingClient = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }
  return _embeddingClient;
};

// Generate embeddings for all chunks in batches of 100.
// Returns chunks unchanged if OPENAI_API_KEY is not set (graceful fallback).
async function generateEmbeddingsForChunks(
  chunks: TextChunk[]
): Promise<(TextChunk & { embedding?: number[] })[]> {
  const embeddingClient = getEmbeddingClient();
  if (!embeddingClient || chunks.length === 0) return chunks;

  const BATCH_SIZE = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const response = await embeddingClient.embeddings.create({
      model: "text-embedding-3-small",
      input: batch.map((c) => c.text),
    });
    response.data.sort((a, b) => a.index - b.index);
    embeddings.push(...response.data.map((d) => d.embedding));
  }

  return chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
}

// ---------------------------------------------------------------------------
// Valid subjects
// ---------------------------------------------------------------------------
const VALID_SUBJECTS = [
  "maths",
  "language",
  "science",
  "history",
  "coding",
  "economics",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file was provided." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "The uploaded file must be a PDF." },
        { status: 400 }
      );
    }

    // 50 MB hard limit
    const MAX_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large. Maximum allowed size is 50 MB." },
        { status: 413 }
      );
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse using the internal path to avoid Next.js
    // test-file resolution issues that occur with the top-level import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse");
    const pdfData = await pdfParse(buffer);
    const rawText: string = pdfData.text ?? "";

    if (rawText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from this PDF. Make sure the PDF contains selectable text (not a scanned image).",
        },
        { status: 422 }
      );
    }

    // Skip the front matter (title page, copyright, TOC) by starting ~8% into
    // the document (capped at 3 000 chars).
    const frontMatterSkip = Math.min(3000, Math.floor(rawText.length * 0.08));
    const contentText = rawText.slice(frontMatterSkip);

    // Send up to 20 000 chars of real content to the model for a thorough analysis.
    const textForAnalysis = contentText.slice(0, 20000);

    // Ask GPT-4o-mini to classify the document and write a comprehensive study summary
    const completion = await getOpenAI().chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at analysing educational documents.
Given document text, return a JSON object with EXACTLY these three fields:
1. "subject" – one of: ${VALID_SUBJECTS.join(", ")} (choose the closest match)
2. "topic"   – a concise, specific title describing the main topic (max 60 characters)
3. "summary" – a comprehensive teaching summary (max 2000 characters) that an AI voice tutor will use to teach the student. Cover the key concepts, main ideas, important definitions, and core lessons from the material. Write it as structured teaching notes, not a book blurb.`,
        },
        {
          role: "user",
          content: `Analyse the following document and return the JSON:\n\n${textForAnalysis}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const aiResult = JSON.parse(
      completion.choices[0].message.content ?? "{}"
    ) as {
      subject?: string;
      topic?: string;
      summary?: string;
    };

    // Validate / fall back for subject
    const subject = VALID_SUBJECTS.includes(aiResult.subject ?? "")
      ? (aiResult.subject as string)
      : "science";

    const topic =
      typeof aiResult.topic === "string" && aiResult.topic.trim().length > 0
        ? aiResult.topic.trim()
        : "General Study Material";

    const pdfContent =
      typeof aiResult.summary === "string" && aiResult.summary.trim().length > 0
        ? `=== TEACHING NOTES ===\n${aiResult.summary.trim()}`
        : "";

    // Chunk the FULL document text and generate embeddings (if OPENAI_API_KEY is set).
    const rawChunks = splitIntoChunks(contentText);
    const chunks = await generateEmbeddingsForChunks(rawChunks);

    return NextResponse.json({ subject, topic, pdfContent, chunks });
  } catch (err) {
    console.error("[extract-pdf] error:", err);
    return NextResponse.json(
      { error: "Failed to process the PDF. Please try again." },
      { status: 500 }
    );
  }
}

