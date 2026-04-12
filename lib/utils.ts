import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
