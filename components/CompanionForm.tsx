"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createCompanion, saveCompanionChunks } from "@/lib/actions/companion.actions"
import { redirect } from "next/navigation"
import Image from "next/image"
import { subjects } from "@/constants"

// PDF state holds what the API extracts from the uploaded file
interface PdfState {
    subject: string
    topic: string
    pdfContent: string
    fileName: string
    chunks: TextChunk[]
}

type ContentMode = "pdf" | "manual"

const formSchema = z.object({
    name: z.string().min(1, { message: "Companion name is required." }),
    subject: z.string().optional(),
    topic: z.string().optional(),
    voice: z.string().min(1, { message: "Voice is required." }),
    style: z.string().min(1, { message: "Style is required." }),
    duration: z.coerce.number().min(1, { message: "Duration is required." }),
})

const CompanionForm = () => {
    const [contentMode, setContentMode] = useState<ContentMode>("pdf")
    const [pdfState, setPdfState] = useState<PdfState | null>(null)
    const [isProcessingPdf, setIsProcessingPdf] = useState(false)
    const [pdfError, setPdfError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            subject: "",
            topic: "",
            voice: "",
            style: "",
            duration: 15,
        },
    })

    // Called when the user picks a PDF file
    const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPdfError(null)
        setPdfState(null)

        // Client-side size guard (50 MB)
        if (file.size > 50 * 1024 * 1024) {
            setPdfError("File is too large. Maximum allowed size is 50 MB.")
            return
        }

        setIsProcessingPdf(true)
        try {
            const body = new FormData()
            body.append("pdf", file)

            const res = await fetch("/api/extract-pdf", { method: "POST", body })
            const data = await res.json()

            if (!res.ok) {
                setPdfError(data.error ?? "Could not process the PDF. Please try again.")
                return
            }

            setPdfState({
                subject: data.subject,
                topic: data.topic,
                pdfContent: data.pdfContent,
                fileName: file.name,
                chunks: Array.isArray(data.chunks) ? data.chunks : [],
            })
        } catch {
            setPdfError("Network error – could not reach the server. Please try again.")
        } finally {
            setIsProcessingPdf(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        let subject: string
        let topic: string
        let pdfContent: string | undefined

        if (contentMode === "pdf") {
            if (!pdfState) {
                setPdfError("Please upload a PDF before building your companion.")
                return
            }
            subject = pdfState.subject
            topic = pdfState.topic
            pdfContent = pdfState.pdfContent
        } else {
            if (!values.subject) {
                form.setError("subject", { message: "Subject is required." })
                return
            }
            if (!values.topic) {
                form.setError("topic", { message: "Topic is required." })
                return
            }
            subject = values.subject
            topic = values.topic
            pdfContent = undefined
        }

        setIsSubmitting(true)
        try {
            const companion = await createCompanion({
                name: values.name,
                voice: values.voice,
                style: values.style,
                duration: values.duration,
                subject,
                topic,
                pdfContent,
            })

            if (companion) {
                // Save all PDF chunks for RAG retrieval (does nothing for manual companions)
                if (pdfState?.chunks?.length) {
                    await saveCompanionChunks(companion.id, pdfState.chunks)
                }
                redirect(`/companions/${companion.id}`)
            } else {
                console.error("Failed to create a companion")
                redirect("/")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-8">

                {/* ── Two-column grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">

                    {/* ── LEFT: companion details ── */}
                    <div className="flex flex-col gap-6">
                        {/* Companion name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Companion name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter the companion name"
                                            {...field}
                                            className="input"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Voice */}
                        <FormField
                            control={form.control}
                            name="voice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Voice</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            defaultValue={field.value}
                                        >
                                            <SelectTrigger className="input">
                                                <SelectValue placeholder="Select the voice" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Style */}
                        <FormField
                            control={form.control}
                            name="style"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Style</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            defaultValue={field.value}
                                        >
                                            <SelectTrigger className="input">
                                                <SelectValue placeholder="Select the style" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="formal">Formal</SelectItem>
                                                <SelectItem value="casual">Casual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Duration */}
                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estimated session duration (minutes)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="15"
                                            {...field}
                                            className="input"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* ── RIGHT: content source ── */}
                    <div className="flex flex-col gap-3 min-h-105">

                        {/* Mode toggle */}
                        <div>
                            <p className="text-sm font-medium mb-2">Study material</p>
                            <div className="inline-flex rounded-lg border border-black/10 dark:border-white/10 p-1 gap-1 bg-black/3 dark:bg-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setContentMode("pdf"); setPdfError(null) }}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                                        ${contentMode === "pdf"
                                            ? "bg-white dark:bg-black/60 shadow-sm text-foreground"
                                            : "text-foreground/50 hover:text-foreground"}`}
                                >
                                    Upload PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setContentMode("manual"); setPdfError(null) }}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                                        ${contentMode === "manual"
                                            ? "bg-white dark:bg-black/60 shadow-sm text-foreground"
                                            : "text-foreground/50 hover:text-foreground"}`}
                                >
                                    Choose subject
                                </button>
                            </div>
                        </div>

                        {/* ── PDF panel ── */}
                        {contentMode === "pdf" && (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-foreground/50">
                                    Upload a PDF — the AI will automatically detect the subject and topic, and use its content during your session.
                                </p>

                                {/* Drop zone */}
                                <div
                                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer
                                        ${isProcessingPdf
                                            ? "border-violet-400/60 bg-violet-500/5"
                                            : pdfState
                                                ? "border-green-500/60 bg-green-500/5"
                                                : pdfError
                                                    ? "border-red-500/60 bg-red-500/5"
                                                    : "border-black/20 dark:border-white/20 hover:border-violet-400/60 hover:bg-violet-500/5"}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={handlePdfChange}
                                        disabled={isProcessingPdf}
                                    />

                                    {isProcessingPdf ? (
                                        <>
                                            <div className="size-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                                            <p className="text-sm font-medium text-violet-500">Analysing PDF…</p>
                                            <p className="text-xs text-foreground/40">Extracting text and detecting subject & topic</p>
                                        </>
                                    ) : pdfState ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                                                    <Image
                                                        src="/icons/check.svg"
                                                        alt="done"
                                                        width={16}
                                                        height={16}
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                                    />
                                                </div>
                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">{pdfState.fileName}</p>
                                            </div>
                                            <p className="text-xs text-foreground/50">Click to replace</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="size-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                                                <svg className="size-5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 3.75 3.75 0 0 1 3.068 6.668" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Click to upload a PDF</p>
                                                <p className="text-xs text-foreground/40 mt-0.5">Max 50 MB · Text-based PDFs only</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {pdfError && <p className="text-sm text-red-500">{pdfError}</p>}

                                {/* AI-detected tags */}
                                {pdfState && (
                                    <div className="flex flex-col gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/3 px-4 py-3">
                                        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">AI-detected</p>
                                        <div className="flex gap-3 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20">
                                                <span className="text-foreground/40">Subject</span> {pdfState.subject}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                                                <span className="text-foreground/40">Topic</span> {pdfState.topic}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Manual panel ── */}
                        {contentMode === "manual" && (
                            <div className="flex flex-col gap-5">
                                <p className="text-xs text-foreground/50">
                                    Choose a subject and describe the topic your companion should focus on.
                                </p>

                                {/* Subject */}
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    defaultValue={field.value}
                                                >
                                                    <SelectTrigger className="input">
                                                        <SelectValue placeholder="Select a subject" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {subjects.map((s) => (
                                                            <SelectItem key={s} value={s}>
                                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Topic */}
                                <FormField
                                    control={form.control}
                                    name="topic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Topic</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Derivatives & Integrals"
                                                    {...field}
                                                    className="input"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Centered submit button ── */}
                <div className="flex justify-center mt-[-70]">
                    <Button
                        type="submit"
                        className="w-full max-w-xs cursor-pointer"
                        disabled={isSubmitting || isProcessingPdf}
                    >
                        {isSubmitting ? "Building…" : "Build Your Companion"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default CompanionForm
