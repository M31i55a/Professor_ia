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


export const configureAssistant = (voice: string, style: string, pdfContent?: string | null) => {
  const voiceId = voices[voice as keyof typeof voices][
          style as keyof (typeof voices)[keyof typeof voices]
          ] || "sarah";

  // Build the system prompt. When PDF content is available, inject it so
  // the tutor stays within the scope of the uploaded study material.
  const pdfSection = pdfContent
    ? `\n\nYou have been given the following study material uploaded by the student. Base your entire teaching session on this content. Only discuss topics related to it — if the student asks about something completely unrelated, politely redirect them back to the material.\n\n${pdfContent}\n`
    : "";

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
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.${pdfSection}
                    Tutor Guidelines:
                    Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                    Keep the conversation flowing smoothly while maintaining control.
                    From time to time make sure that the student is following you and understands you.
                    Break down the topic into smaller parts and teach the student one part at a time.
                    Keep your style of conversation {{ style }}.
                    Keep your responses short, like in a real voice conversation.
                    Do not include any special characters in your responses - this is a voice conversation.
              `,
        },
      ],
    },
    clientMessages: [] as any,
    serverMessages: [] as any,
  };
  return vapiAssistant;
};