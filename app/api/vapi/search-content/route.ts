import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import OpenAI from "openai";

// Lazy embedding client — instantiated on first request, not at module evaluation
// time. This prevents Vercel build failures when OPENAI_API_KEY is not set.
let _embeddingClient: OpenAI | null | undefined = undefined;
const getEmbeddingClient = () => {
  if (_embeddingClient === undefined) {
    _embeddingClient = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }
  return _embeddingClient;
};

// ---------------------------------------------------------------------------
// VAPI tool-call webhook: searchContent
//
// VAPI calls this endpoint whenever the voice assistant decides to invoke the
// "searchContent" tool.  We look up the 3 most relevant chunks from the
// companion's stored PDF text and return them so the LLM can answer
// accurately, regardless of how long the original document is.
//
// The companionId is embedded in the URL query string so it is always
// authoritative (the LLM cannot alter it):
//   POST /api/vapi/search-content?companionId=<id>
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();

    // VAPI sends tool calls in two possible formats depending on SDK version.
    const toolCallList: any[] | undefined =
      body?.message?.toolCallList ?? body?.message?.toolCalls;
    const functionCall: any | undefined = body?.message?.functionCall;

    // Helper: resolve companionId from URL param OR tool arguments.
    // When using a VAPI dashboard assistant the URL has no companionId –
    // the AI passes it as a function argument instead.
    const resolveCompanionId = (args: Record<string, any>): number => {
      const fromUrl = parseInt(searchParams.get("companionId") ?? "0", 10);
      if (fromUrl) return fromUrl;
      return parseInt(String(args?.companionId ?? "0"), 10);
    };

    // ---- legacy function-call format ----
    if (functionCall?.name === "searchContent") {
      const args = functionCall.parameters ?? {};
      const companionId = resolveCompanionId(args);
      if (!companionId) return NextResponse.json({ result: "No companion specified." });
      const result = await searchChunks(companionId, args.query ?? "");
      return NextResponse.json({ result });
    }

    // ---- toolCallList format ----
    if (Array.isArray(toolCallList) && toolCallList.length > 0) {
      const results = await Promise.all(
        toolCallList
          .filter((tc: any) => tc?.function?.name === "searchContent")
          .map(async (tc: any) => {
            const args =
              typeof tc.function.arguments === "string"
                ? JSON.parse(tc.function.arguments)
                : tc.function.arguments ?? {};
            const companionId = resolveCompanionId(args);
            const result = companionId
              ? await searchChunks(companionId, args.query ?? "")
              : "No companion specified.";
            return { toolCallId: tc.id, result };
          })
      );
      return NextResponse.json({ results });
    }

    return NextResponse.json({ result: "" });
  } catch (err) {
    console.error("[search-content] error:", err);
    return NextResponse.json({ result: "" });
  }
}

// ---------------------------------------------------------------------------
// Core retrieval logic
// ---------------------------------------------------------------------------
async function searchChunks(
  companionId: number,
  searchQuery: string
): Promise<string> {
  if (!searchQuery.trim()) return "";

  try {
    // 1. Vector similarity search (semantic — understands meaning, not just keywords)
    const embeddingClient = getEmbeddingClient();
    if (embeddingClient) {
      const embRes = await embeddingClient.embeddings.create({
        model: "text-embedding-3-small",
        input: searchQuery,
      });
      const queryVector = `[${embRes.data[0].embedding.join(",")}]`;

      const vectorResult = await query(
        `SELECT content
           FROM companion_chunks
          WHERE companion_id = $1
            AND embedding IS NOT NULL
          ORDER BY embedding <=> $2::vector
          LIMIT 3`,
        [companionId, queryVector]
      );

      if (vectorResult.rows.length > 0) {
        return vectorResult.rows
          .map((r: { content: string }) => r.content)
          .join("\n\n---\n\n");
      }
    }

    // 2. Full-text search fallback (for companions created before pgvector was added)
    const ftsResult = await query(
      `SELECT content
         FROM companion_chunks
        WHERE companion_id = $1
          AND to_tsvector('english', content) @@ plainto_tsquery('english', $2)
        ORDER BY ts_rank(
                   to_tsvector('english', content),
                   plainto_tsquery('english', $2)
                 ) DESC
        LIMIT 3`,
      [companionId, searchQuery]
    );

    if (ftsResult.rows.length > 0) {
      return ftsResult.rows
        .map((r: { content: string }) => r.content)
        .join("\n\n---\n\n");
    }

    // 3. Keyword regex fallback
    const keywords = searchQuery
      .split(/\s+/)
      .filter((k) => k.length > 2)
      .slice(0, 6)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (keywords.length === 0) return "";

    const fallbackResult = await query(
      `SELECT content
         FROM companion_chunks
        WHERE companion_id = $1
          AND content ~* $2
        ORDER BY chunk_index ASC
        LIMIT 3`,
      [companionId, keywords.join("|")]
    );

    return fallbackResult.rows
      .map((r: { content: string }) => r.content)
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("[search-content] DB error:", err);
    return "";
  }
}
