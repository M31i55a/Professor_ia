import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Increase allowed execution time for heavy PDF processing
export const maxDuration = 60;

// Tell Next.js not to apply any body-size limit on this route handler.
// (The serverActions.bodySizeLimit in next.config only covers Server Actions.)
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Valid subjects that the companion system recognises
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

    // Truncate to ~12 000 chars before sending to OpenAI to stay within token limits
    const textForAnalysis = rawText.slice(0, 12000);

    // Ask GPT-4o-mini to classify the document and write a study summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at analysing educational documents.
Given document text, return a JSON object with EXACTLY these three fields:
1. "subject" – one of: ${VALID_SUBJECTS.join(", ")} (choose the closest match)
2. "topic"   – a concise, specific title describing the main topic (max 60 characters)
3. "summary" – a rich but concise summary (max 600 characters) that an AI voice tutor will use to teach the student. Write it in the third person, e.g. "This document covers …".`,
        },
        {
          role: "user",
          content: `Analyse the following document and return the JSON:\n\n${textForAnalysis}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
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

    const summary =
      typeof aiResult.summary === "string" ? aiResult.summary.trim() : "";

    // Build the context string that will be stored in the DB and passed to
    // the VAPI assistant as part of its system prompt (kept ≤ 3 000 chars).
    const pdfContent = [
      "=== DOCUMENT SUMMARY ===",
      summary,
      "",
      "=== CONTENT EXCERPT ===",
      rawText.slice(0, 2000),
    ]
      .join("\n")
      .slice(0, 3000);

    return NextResponse.json({ subject, topic, pdfContent });
  } catch (err) {
    console.error("[extract-pdf] error:", err);
    return NextResponse.json(
      { error: "Failed to process the PDF. Please try again." },
      { status: 500 }
    );
  }
}
