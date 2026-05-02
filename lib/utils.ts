import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subjectsColors, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    maths: "#FF6B6B",
    language: "#4ECDC4",
    science: "#45B7D1",
    history: "#96CEB4",
    coding: "#FFEAA7",
    geography: "#DDA15E",
    economics: "#BC6C25",
    finance: "#6C63FF",
    business: "#FF9FF3",
  }
  return colors[subject] || "#E0E0E0"
}


export const getVoiceId = (voice: string, style: string): string => {
  return voices[voice as keyof typeof voices]?.[
    style as keyof (typeof voices)[keyof typeof voices]
  ] || "sarah";
};

export const buildSystemPrompt = (
  subject: string,
  topic: string,
  style: string,
  pdfContent?: string | null
): string => {
  const knowledgeSection = pdfContent
    ? `\n\n===== STUDENT STUDY MATERIAL (SUMMARY) =====\nThe student uploaded study material. Use this as your primary knowledge base. For detailed questions, use the searchContent tool to retrieve specific passages.\n\n${pdfContent}\n===== END OF SUMMARY =====\n`
    : "";

  return `You are a tutor running a real-time voice session with a student on the topic "${topic}" (subject: ${subject}).${knowledgeSection}

Tutor rules:
- If study material was uploaded, base content answers on it. Use the searchContent tool to find specific passages when the student asks about details.
- If the student asks something not in the material, say: "That's not covered in your study material, but it's worth exploring further."
- Keep the conversation flowing and check the student's understanding periodically.
- Break down the topic into smaller parts and teach one part at a time.
- Adapt your tone to the requested style: ${style}.
- Keep responses SHORT - this is a voice conversation, not a lecture.
- Do not use special characters, markdown, bullet points, or formatting - voice only.`;
};

export const configureAssistant = (
  voice: string,
  style: string,
  pdfContent?: string | null,
  companionId?: number | string | null
) => {
  const voiceId = getVoiceId(voice, style);
  const systemContent = buildSystemPrompt("{{ subject }}", "{{ topic }}", "{{ style }}", pdfContent);

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage:
        "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openrouter",
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: systemContent,
        },
      ],
    },
    clientMessages: [] as any,
    serverMessages: [] as any,
  };
  return vapiAssistant;
};