'use client';

import {useEffect, useRef, useState} from 'react'
import {cn, configureAssistant, buildSystemPrompt, getVoiceId, getSubjectColor} from "@/lib/utils";
import {vapi} from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie, {LottieRefCurrentProps} from "lottie-react";
import soundwaves from '@/constants/soundwaves.json'
import {addToSessionHistory} from "@/lib/actions/companion.actions";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice, duration, pdf_content }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<(SavedMessage & { _id: number })[]>([]);
    const [liveTranscript, setLiveTranscript] = useState<{ role: string; content: string } | null>(null);
    const [callError, setCallError] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(duration * 60);
    const wasActiveRef = useRef(false);
    const msgIdRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if(lottieRef) {
            if(isSpeaking) {
                lottieRef.current?.play()
            } else {
                lottieRef.current?.stop()
            }
        }
    }, [isSpeaking, lottieRef])

    useEffect(() => {
        const onCallStart = () => {
            wasActiveRef.current = true;
            setCallError(null);
            setSecondsLeft(duration * 60);
            setCallStatus(CallStatus.ACTIVE);
            // Start countdown
            timerRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        timerRef.current = null;
                        vapi.stop();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const onCallEnd = () => {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setCallStatus(CallStatus.FINISHED);
            setLiveTranscript(null);
            if (wasActiveRef.current) {
                addToSessionHistory(companionId);
                wasActiveRef.current = false;
            }
        };

        const onMessage = (message: Message) => {
            if (message.type === 'transcript') {
                if (message.transcriptType === 'partial') {
                    setLiveTranscript({ role: message.role, content: message.transcript });
                } else if (message.transcriptType === 'final') {
                    msgIdRef.current += 1;
                    const newMessage = { role: message.role, content: message.transcript, _id: msgIdRef.current };
                    setMessages((prev) => [newMessage, ...prev]);
                    setLiveTranscript(null);
                }
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: any) => {
            console.warn('VAPI error', error);
            const toStr = (v: unknown) => (typeof v === 'string' && v ? v : null);
            const message =
                toStr(error?.error?.message) ||
                toStr(error?.message) ||
                (typeof error === 'string' ? error : null) ||
                'An error occurred during the session. Please check your VAPI configuration.';
            setCallError(message);
            setCallStatus(CallStatus.FINISHED);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
        }
    }, []);

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted)
    }

    const handleCall = async () => {
        setCallError(null);
        wasActiveRef.current = false;
        setCallStatus(CallStatus.CONNECTING)

        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

        if (assistantId) {
            // Dashboard assistant mode (like jsm_bookified): the searchContent tool
            // is registered on the VAPI dashboard. The AI fetches relevant chunks
            // on demand — no book content injected into the prompt, works for any size.
            vapi.start(assistantId as any, {
                variableValues: { subject, topic, style, companionId: String(companionId) },
                model: {
                    messages: [{ role: 'system', content: buildSystemPrompt(subject, topic, style, pdf_content) }],
                } as any,
                voice: {
                    provider: '11labs',
                    voiceId: getVoiceId(voice, style),
                    stability: 0.4,
                    similarityBoost: 0.8,
                    speed: 1,
                    style: 0.5,
                    useSpeakerBoost: true,
                } as any,
                clientMessages: ['transcript'] as any,
                serverMessages: [] as any,
            });
        } else {
            // Inline assistant mode (fallback): no tool support, uses pdfContent summary only.
            const assistantOverrides = {
                variableValues: { subject, topic, style },
                clientMessages: ['transcript'] as any,
                serverMessages: [] as any,
            }
            vapi.start(configureAssistant(voice, style, pdf_content, companionId), assistantOverrides)
        }
    }

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    return (
        <section className="flex flex-col flex-1 gap-4 overflow-hidden min-h-0">
            <section className="flex gap-4 max-sm:flex-col shrink-0">

                {/* AI Companion Panel */}
                <div className="companion-section">
                    {/* Status badge */}
                    <div className={cn('session-status',
                        callStatus === CallStatus.ACTIVE
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : callStatus === CallStatus.CONNECTING
                            ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                            : callStatus === CallStatus.FINISHED
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-white/5 text-white/40 border border-white/10'
                    )}>
                        <span className={cn('size-1.5 rounded-full inline-block',
                            callStatus === CallStatus.ACTIVE ? 'bg-cyan-400 animate-pulse' :
                            callStatus === CallStatus.CONNECTING ? 'bg-orange-400 animate-pulse' :
                            callStatus === CallStatus.FINISHED ? 'bg-purple-400' : 'bg-white/30'
                        )} />
                        {callStatus === CallStatus.ACTIVE ? 'Session Active' :
                         callStatus === CallStatus.CONNECTING ? 'Connecting...' :
                         callStatus === CallStatus.FINISHED ? 'Session Ended' : 'Ready'}
                    </div>

                    {/* Avatar with orbital rings */}
                    <div className="avatar-orbit-wrapper">
                        <div className="avatar-ring avatar-ring-1" />
                        <div className="avatar-ring avatar-ring-2" />
                        <div className="avatar-ring avatar-ring-3" />

                        <div className={cn('companion-avatar',
                            callStatus === CallStatus.ACTIVE ? 'companion-avatar-active' :
                            callStatus === CallStatus.CONNECTING ? 'companion-avatar-connecting' :
                            callStatus === CallStatus.FINISHED ? 'companion-avatar-finished' :
                            'companion-avatar-inactive'
                        )} style={{ backgroundColor: getSubjectColor(subject) }}>
                            {/* Subject icon */}
                            <div className={cn(
                                'absolute transition-opacity duration-1000',
                                callStatus === CallStatus.ACTIVE ? 'opacity-0' : 'opacity-100',
                                callStatus === CallStatus.CONNECTING && 'animate-pulse'
                            )}>
                                <Image src={`/icons/${subject}.svg`} alt={subject} width={80} height={80} />
                            </div>

                            {/* Sound wave animation */}
                            <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                                <Lottie
                                    lottieRef={lottieRef}
                                    animationData={soundwaves}
                                    autoplay={false}
                                    className="companion-lottie"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="font-bold text-xl text-white/90 z-10 tracking-wide">{name}</p>
                </div>

                {/* User Panel */}
                <div className="user-section">
                    <div className="user-avatar">
                        <Image src={userImage} alt={userName} width={80} height={80} className="rounded-full ring-2 ring-cyan-400/20" />
                        <p className="font-semibold text-lg">{userName}</p>
                    </div>

                    <button className="btn-mic" onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={34} height={34} />
                        <p className="max-sm:hidden text-sm font-medium">
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                    </button>

                    <button
                        className={cn('btn-call',
                            callStatus === CallStatus.ACTIVE ? 'btn-call-end' :
                            callStatus === CallStatus.CONNECTING ? 'btn-call-connecting' :
                            'btn-call-start'
                        )}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        disabled={callStatus === CallStatus.CONNECTING}
                    >
                        {callStatus === CallStatus.ACTIVE ? 'End Session' :
                         callStatus === CallStatus.CONNECTING ? 'Connecting...' :
                         'Start Session'}
                    </button>

                    {callStatus === CallStatus.ACTIVE && (
                        <p className={cn(
                            'text-sm font-mono font-semibold tabular-nums',
                            secondsLeft <= 60 ? 'text-red-400 animate-pulse' :
                            secondsLeft <= 180 ? 'text-orange-400' : 'text-white/50'
                        )}>
                            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} remaining
                        </p>
                    )}
                </div>
            </section>

            {callError && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: 'rgb(252,165,165)' }}>
                    <strong>Session error:</strong> {typeof callError === 'string' ? callError : JSON.stringify(callError)}
                </div>
            )}

            <section className="transcript">
                <div className="transcript-block">
                    {messages.slice(0, 3).map((message) => (
                        <p key={message._id} className="transcript-line">
                            <span className={message.role === 'assistant' ? 'font-bold text-purple-400' : 'font-bold text-cyan-400'}>
                                {message.role === 'assistant' ? name.split(' ')[0] : userName}:
                            </span>{' '}
                            {message.content}
                        </p>
                    ))}
                    {liveTranscript && (
                        <p className="transcript-line-live">
                            <span className={cn('font-bold not-italic', liveTranscript.role === 'assistant' ? 'text-purple-400' : 'text-cyan-400')}>
                                {liveTranscript.role === 'assistant' ? name.split(' ')[0] : userName}:
                            </span>{' '}
                            {liveTranscript.content}
                            <span className="inline-block w-0.5 h-3.5 bg-current ml-1 align-middle animate-pulse" />
                        </p>
                    )}
                </div>
                <div className="transcript-fade" />
            </section>
        </section>
    )
}

export default CompanionComponent
