#!/usr/bin/env node
/**
 * Run this script once to generate the PDF feature tutorial:
 *   node scripts/generate-tutorial.js
 * It will create PDF_COMPANION_TUTORIAL.docx in the project root.
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── helpers ──────────────────────────────────────────────────────────────────

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 120 },
  });
}

function heading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
  });
}

function heading3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 60 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22 });
}

function code(text) {
  return new TextRun({
    text,
    font: "Courier New",
    size: 20,
    color: "7C3AED",
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function codeBlock(lines) {
  return new Paragraph({
    children: [new TextRun({ text: lines.join("\n"), font: "Courier New", size: 19, color: "1F2937" })],
    spacing: { after: 160, before: 80 },
    shading: { type: ShadingType.SOLID, color: "F3F4F6" },
    indent: { left: 360 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: "7C3AED" },
    },
  });
}

function note(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "💡 Note: ", bold: true, size: 22, color: "7C3AED" }),
      new TextRun({ text, size: 22 }),
    ],
    spacing: { after: 120 },
    shading: { type: ShadingType.SOLID, color: "EDE9FE" },
    indent: { left: 200, right: 200 },
  });
}

function spacer() {
  return new Paragraph({ text: "", spacing: { after: 80 } });
}

// ─── document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Normal",
        name: "Normal",
        run: { font: "Calibri", size: 22, color: "111827" },
      },
    ],
  },
  sections: [
    {
      properties: {},
      children: [
        // ── Title page ──
        new Paragraph({
          children: [
            new TextRun({
              text: "PDF Study Material Feature",
              bold: true,
              size: 52,
              color: "7C3AED",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "A Beginner's Tutorial — Professor IA",
              size: 28,
              color: "6B7280",
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),

        // ── 1. Overview ──
        heading1("1. What We Built"),
        body(
          "We added a brand-new feature to Professor IA that lets students upload a PDF of their study material when creating a new AI companion. " +
          "Instead of manually picking a subject and typing a topic, the system now:"
        ),
        bullet("Accepts a PDF file up to 50 MB from the user."),
        bullet("Extracts all the text from the PDF on the server (no third-party cloud storage needed)."),
        bullet("Sends that text to OpenAI (GPT-4o-mini) which automatically detects the subject (e.g. 'science', 'maths') and a descriptive topic title."),
        bullet("Saves a compact summary of the PDF in the database alongside the companion."),
        bullet("Injects that summary into the AI tutor's instructions so every voice session is grounded in the student's own material."),
        spacer(),

        // ── 2. Files changed ──
        heading1("2. Files Changed / Created"),

        heading2("New files"),
        bullet("app/api/extract-pdf/route.ts — the API endpoint that receives the PDF, extracts text, and calls OpenAI."),
        bullet("migrations/add_pdf_content.sql — a SQL file to add the new column to an existing database."),
        bullet("scripts/generate-tutorial.js — this script itself, which produces the .docx tutorial."),
        spacer(),

        heading2("Modified files"),
        bullet("components/CompanionForm.tsx — replaced the 'Subject' and 'Topic' form fields with a PDF upload zone."),
        bullet("lib/actions/companion.actions.ts — updated createCompanion() to save the pdf_content to the database."),
        bullet("lib/utils.ts — updated configureAssistant() to accept PDF content and include it in the AI's instructions."),
        bullet("components/CompanionComponent.tsx — passes pdf_content from the DB to configureAssistant() when a session starts."),
        bullet("types/index.d.ts — added pdfContent to CreateCompanion and pdf_content to CompanionComponentProps."),
        bullet("migrations/init.sql — added the pdf_content TEXT column to the companions table definition."),
        bullet("next.config.ts — increased the allowed request body size to 50 MB for PDF uploads."),
        spacer(),

        // ── 3. Libraries used ──
        heading1("3. Libraries Used and Why"),

        heading2("pdf-parse"),
        body(
          "pdf-parse is a lightweight Node.js library that reads the binary data of a PDF file and returns all the text inside it. " +
          "It runs entirely on your server — no external API calls, no file uploads to a cloud service. " +
          "It handles most real PDFs (those with selectable text). It does NOT work on scanned images; for those you would need OCR software."
        ),
        note("We import it from 'pdf-parse/lib/pdf-parse' instead of 'pdf-parse' to avoid a known bug where Next.js tries to read test files that don't exist during the build."),
        spacer(),

        heading2("openai (official SDK)"),
        body(
          "The openai package is the official JavaScript/TypeScript SDK from OpenAI. " +
          "We use it to call GPT-4o-mini with a slice of the extracted PDF text. " +
          "GPT-4o-mini reads the text and replies with a JSON object containing the subject, a topic title, and a concise summary. " +
          "This is much more accurate than asking the user to type a topic themselves."
        ),
        note("You must set the OPENAI_API_KEY environment variable in your .env.local file for this to work."),
        spacer(),

        heading2("docx"),
        body(
          "The docx library lets us create proper Microsoft Word documents from JavaScript code. " +
          "It is only used by this tutorial-generation script — it is not part of the running application."
        ),
        spacer(),

        // ── 4. Environment variables ──
        heading1("4. Environment Variables Required"),
        body("Add the following line to your .env.local file (create it in the project root if it doesn't exist):"),
        codeBlock(["OPENAI_API_KEY=sk-your-openai-key-here"]),
        body(
          "You can get an API key by visiting https://platform.openai.com/api-keys and creating a new key. " +
          "GPT-4o-mini is very inexpensive — processing a typical study PDF costs less than $0.01."
        ),
        spacer(),

        // ── 5. How it works step by step ──
        heading1("5. How It Works — Step by Step"),

        heading2("Step 1 — The user opens the 'New Companion' page"),
        body(
          "The form now shows a drag-and-click upload zone instead of the Subject and Topic inputs. " +
          "The user clicks the zone and picks a PDF from their computer."
        ),
        spacer(),

        heading2("Step 2 — The browser sends the PDF to the server"),
        body(
          "When the user picks a file, the CompanionForm component immediately calls our API route. " +
          "It uses the browser's built-in FormData and fetch() to send a POST request to /api/extract-pdf."
        ),
        codeBlock([
          "const body = new FormData();",
          "body.append('pdf', file);",
          "const res = await fetch('/api/extract-pdf', { method: 'POST', body });",
        ]),
        spacer(),

        heading2("Step 3 — The server extracts text from the PDF"),
        body(
          "Inside app/api/extract-pdf/route.ts, the server reads the incoming file using request.formData(). " +
          "It then passes the file's binary data (a Buffer) to pdf-parse, which returns all readable text."
        ),
        codeBlock([
          "const pdfParse = require('pdf-parse/lib/pdf-parse');",
          "const pdfData  = await pdfParse(buffer);",
          "const rawText  = pdfData.text; // all text from the PDF",
        ]),
        spacer(),

        heading2("Step 4 — OpenAI analyses the text"),
        body(
          "We send the first 12,000 characters of the extracted text to GPT-4o-mini with clear instructions to return a JSON object. " +
          "The model replies with the subject (from a fixed list), a concise topic title, and a study summary."
        ),
        codeBlock([
          "const completion = await openai.chat.completions.create({",
          "  model: 'gpt-4o-mini',",
          "  messages: [ { role: 'system', content: '...' }, { role: 'user', content: textForAnalysis } ],",
          "  response_format: { type: 'json_object' },",
          "});",
          "const { subject, topic, summary } = JSON.parse(completion.choices[0].message.content);",
        ]),
        spacer(),

        heading2("Step 5 — The form shows the auto-detected result"),
        body(
          "The API route returns { subject, topic, pdfContent } to the browser. " +
          "The form displays the detected subject and topic in read-only badges so the user can see what the AI found. " +
          "A green checkmark shows the file was processed successfully."
        ),
        spacer(),

        heading2("Step 6 — The companion is saved to the database"),
        body(
          "When the user clicks 'Build Your Companion', the form calls the createCompanion() server action " +
          "with the detected subject, topic, and the pdfContent string. " +
          "The server action inserts a new row into the companions table, including the pdf_content column."
        ),
        spacer(),

        heading2("Step 7 — The AI uses the PDF during the voice session"),
        body(
          "When the student starts a session, CompanionComponent calls configureAssistant(voice, style, pdf_content). " +
          "The pdf_content is injected into the AI's system prompt:"
        ),
        codeBlock([
          "You have been given the following study material uploaded by the student.",
          "Base your entire teaching session on this content.",
          "Only discuss topics related to it.",
          "",
          "=== DOCUMENT SUMMARY ===",
          "<AI-generated summary>",
          "",
          "=== CONTENT EXCERPT ===",
          "<first 2000 chars of the PDF text>",
        ]),
        body(
          "This means the voice tutor has read the student's actual notes or textbook and will teach from them directly, " +
          "answering questions about exactly that material."
        ),
        spacer(),

        // ── 6. Running the migration ──
        heading1("6. Running the Database Migration"),
        body(
          "If you already had companions in your database before this update, you need to add the new column. " +
          "Run this command once inside the project folder:"
        ),
        codeBlock([
          "# Using psql (replace password/db name if different):",
          'psql -U postgres -d professor_ia -c "ALTER TABLE companions ADD COLUMN IF NOT EXISTS pdf_content TEXT DEFAULT NULL;"',
        ]),
        body("Alternatively, you can run the file migrations/add_pdf_content.sql through any PostgreSQL client (e.g. pgAdmin or TablePlus)."),
        note("The column is nullable (NULL by default), so all your existing companions will still work perfectly — they just won't have PDF context."),
        spacer(),

        // ── 7. Things to keep in mind ──
        heading1("7. Things to Keep in Mind"),
        bullet("Only text-based PDFs work. Scanned PDFs (images of pages) have no selectable text. For scanned documents you would need an OCR service like AWS Textract or Google Document AI."),
        bullet("The maximum file size is 50 MB. This is generous for text-based study material but very large PDFs may take a few seconds to process."),
        bullet("The OpenAI call costs a tiny amount of money per PDF (usually well under 1 cent). Make sure your API key has billing set up."),
        bullet("The system prompt passed to the VAPI voice assistant is limited. We store up to 3,000 characters of PDF context. For very long documents the AI only sees the beginning of the content."),
        bullet("OPENAI_API_KEY must be in your .env.local file (it is never exposed to the browser)."),
        spacer(),

        // ── 8. Quick setup summary ──
        heading1("8. Quick Setup Checklist"),
        bullet("✅ npm install pdf-parse openai docx — already done."),
        bullet("✅ Add OPENAI_API_KEY=sk-... to .env.local"),
        bullet("✅ Run the DB migration (ALTER TABLE companions ADD COLUMN IF NOT EXISTS pdf_content TEXT DEFAULT NULL)"),
        bullet("✅ Restart the dev server: npm run dev"),
        bullet("✅ Go to /companions/new and upload a PDF — you should see the AI detect the subject and topic automatically."),
        spacer(),

        new Paragraph({
          children: [
            new TextRun({
              text: "Happy studying! 🎓",
              bold: true,
              size: 28,
              color: "7C3AED",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
        }),
      ],
    },
  ],
});

// ─── write to disk ─────────────────────────────────────────────────────────────

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, "..", "PDF_COMPANION_TUTORIAL.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Tutorial written to PDF_COMPANION_TUTORIAL.docx");
});
