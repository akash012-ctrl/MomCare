import { nanoid } from "nanoid/non-secure";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InCallManager from "react-native-incall-manager";
import {
    MediaStream,
    RTCPeerConnection,
    RTCSessionDescription,
    mediaDevices,
} from "react-native-webrtc";

import type { RealtimeTokenResponse } from "@/lib/supabase-api";
import { getRealtimeToken } from "@/lib/supabase-api";

export type VoiceSessionStatus =
    | "idle"
    | "connecting"
    | "connected"
    | "disconnecting"
    | "error";

type VoiceRole = "assistant" | "user";

export interface VoiceTranscript {
    id: string;
    role: VoiceRole;
    text: string;
    timestamp: number;
}

export interface RealtimeVoiceSessionDetails {
    model: string;
    voice: string;
    language: "en" | "hi";
    expiresAt: string;
}

interface UseRealtimeVoiceOptions {
    language: "en" | "hi";
    instructions?: string;
}

interface UseRealtimeVoiceResult {
    status: VoiceSessionStatus;
    transcripts: VoiceTranscript[];
    partialAssistantText: string;
    isMuted: boolean;
    isAssistantSpeaking: boolean;
    isUserSpeaking: boolean;
    error: string | null;
    sessionDetails: RealtimeVoiceSessionDetails | null;
    remoteStreamUrl: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    toggleMute: () => void;
}

type Nullable<T> = T | null;

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
];

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === "complete") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const typedPc = pc as unknown as {
            onicecandidate: ((event: { candidate: unknown } | null) => void) | null;
        };

        typedPc.onicecandidate = (event) => {
            if (!event || !event.candidate) {
                typedPc.onicecandidate = null;
                resolve();
            }
        };
    });
}

function createTranscriptEntry(role: VoiceRole, text: string): VoiceTranscript | null {
    const trimmed = text.trim();
    if (!trimmed) {
        return null;
    }

    return {
        id: nanoid(),
        role,
        text: trimmed,
        timestamp: Date.now(),
    };
}

export function useRealtimeVoice({
    language,
    instructions,
}: UseRealtimeVoiceOptions): UseRealtimeVoiceResult {
    const [status, setStatus] = useState<VoiceSessionStatus>("idle");
    const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
    const [partialAssistantText, setPartialAssistantText] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionDetails, setSessionDetails] =
        useState<RealtimeVoiceSessionDetails | null>(null);
    const [remoteStreamUrlState, setRemoteStreamUrlState] = useState<string | null>(null);

    const peerConnectionRef = useRef<Nullable<RTCPeerConnection>>(null);
    const dataChannelRef = useRef<Nullable<any>>(null);
    const dataChannelReadyRef = useRef<boolean>(false);
    const localStreamRef = useRef<Nullable<MediaStream>>(null);
    const remoteStreamRef = useRef<Nullable<MediaStream>>(null);
    const assistantBufferRef = useRef("");
    const userBufferRef = useRef("");
    const statusRef = useRef<VoiceSessionStatus>("idle");

    const sendDataChannelEvent = useCallback((event: unknown) => {
        const channel = dataChannelRef.current;
        if (!channel || !dataChannelReadyRef.current || channel.readyState !== "open") {
            console.warn("Realtime voice data channel not ready for outbound events");
            return;
        }

        try {
            const payload = typeof event === "string" ? event : JSON.stringify(event);
            channel.send(payload);
        } catch (sendError) {
            console.error("Failed to send realtime event", sendError);
        }
    }, []);

    const performWebSearch = useCallback(
        async (rawQuery: unknown): Promise<string> => {
            const queryCandidate = typeof rawQuery === "string" ? rawQuery.trim() : "";
            if (!queryCandidate) {
                return language === "hi"
                    ? "कोई खोज वाक्य नहीं दिया गया।"
                    : "No search query provided.";
            }

            try {
                const response = await fetch(
                    `https://api.duckduckgo.com/?q=${encodeURIComponent(queryCandidate)}&format=json&no_redirect=1&skip_disambig=1`
                );

                if (!response.ok) {
                    throw new Error(`Search HTTP ${response.status}`);
                }

                const body = await response.json();
                const items: string[] = [];

                if (typeof body?.AbstractText === "string" && body.AbstractText.trim()) {
                    items.push(body.AbstractText.trim());
                }

                if (Array.isArray(body?.RelatedTopics)) {
                    for (const topic of body.RelatedTopics) {
                        if (typeof topic?.Text === "string" && typeof topic?.FirstURL === "string") {
                            items.push(`${topic.Text} (${topic.FirstURL})`);
                        }
                        if (items.length >= 3) {
                            break;
                        }
                    }
                }

                if (items.length < 3 && Array.isArray(body?.Results)) {
                    for (const entry of body.Results) {
                        if (typeof entry?.Text === "string" && typeof entry?.FirstURL === "string") {
                            items.push(`${entry.Text} (${entry.FirstURL})`);
                        }
                        if (items.length >= 3) {
                            break;
                        }
                    }
                }

                if (!items.length) {
                    return language === "hi"
                        ? "उस खोज के लिए स्पष्ट परिणाम नहीं मिले।"
                        : "No direct results found for that search.";
                }

                const joined = items.join("\n");
                return language === "hi"
                    ? `वेब खोज से प्राप्त मुख्य बिंदु:\n${joined}`
                    : `Key findings from the web search:\n${joined}`;
            } catch (searchError) {
                console.error("Web search failed", searchError);
                return language === "hi"
                    ? "वेब खोज करते समय त्रुटि हुई, थोड़ी देर बाद पुनः प्रयास करें।"
                    : "Web search encountered an error. Please try again soon.";
            }
        },
        [language]
    );

    const resolveToolCalls = useCallback(
        async (payload: any) => {
            const responseId: string | undefined =
                typeof payload?.response_id === "string"
                    ? payload.response_id
                    : typeof payload?.response?.id === "string"
                        ? payload.response.id
                        : undefined;

            const action = payload?.required_action;

            if (!responseId || !action || action.type !== "tool_calls.create") {
                return;
            }

            const toolCalls = Array.isArray(action.tool_calls) ? action.tool_calls : [];
            if (!toolCalls.length) {
                return;
            }

            const outputs: { tool_call_id: string; output: string }[] = [];

            for (const toolCall of toolCalls) {
                const callId =
                    typeof toolCall?.id === "string"
                        ? toolCall.id
                        : typeof toolCall?.tool_call_id === "string"
                            ? toolCall.tool_call_id
                            : nanoid();

                const toolName: string | undefined =
                    typeof toolCall?.type === "string"
                        ? toolCall.type
                        : typeof toolCall?.name === "string"
                            ? toolCall.name
                            : typeof toolCall?.function?.name === "string"
                                ? toolCall.function.name
                                : undefined;

                try {
                    if (toolName === "web_search") {
                        const rawArgs =
                            toolCall?.args ??
                            toolCall?.arguments ??
                            toolCall?.function?.arguments ??
                            toolCall?.input ??
                            toolCall?.query ??
                            "";

                        let queryValue = "";
                        if (typeof rawArgs === "string" && rawArgs.trim()) {
                            try {
                                const parsed = JSON.parse(rawArgs);
                                if (typeof parsed?.query === "string") {
                                    queryValue = parsed.query;
                                } else if (typeof parsed === "string") {
                                    queryValue = parsed;
                                } else if (parsed && typeof parsed === "object") {
                                    queryValue = JSON.stringify(parsed);
                                } else {
                                    queryValue = rawArgs;
                                }
                            } catch {
                                queryValue = rawArgs;
                            }
                        } else if (rawArgs && typeof rawArgs === "object") {
                            if (typeof rawArgs.query === "string") {
                                queryValue = rawArgs.query;
                            } else {
                                queryValue = JSON.stringify(rawArgs);
                            }
                        }

                        const searchOutput = await performWebSearch(queryValue);
                        outputs.push({ tool_call_id: callId, output: searchOutput });
                    } else {
                        const unsupported = language === "hi"
                            ? "यह अनुरोधित टूल अभी उपलब्ध नहीं है।"
                            : "This requested tool is not yet supported.";
                        outputs.push({ tool_call_id: callId, output: unsupported });
                    }
                } catch (toolError) {
                    console.error("Realtime tool resolution failed", toolError);
                    const failureMessage =
                        toolError instanceof Error ? toolError.message : "Tool call failed";
                    outputs.push({ tool_call_id: callId, output: failureMessage });
                }
            }

            if (outputs.length) {
                sendDataChannelEvent({
                    type: "response_tool_outputs.create",
                    response_id: responseId,
                    tool_outputs: outputs,
                });
            }
        },
        [language, performWebSearch, sendDataChannelEvent]
    );

    const updateStatus = useCallback((next: VoiceSessionStatus) => {
        statusRef.current = next;
        setStatus(next);
    }, []);

    const resetState = useCallback(() => {
        assistantBufferRef.current = "";
        userBufferRef.current = "";
        setTranscripts([]);
        setPartialAssistantText("");
        setIsAssistantSpeaking(false);
        setIsUserSpeaking(false);
        setIsMuted(false);
        setSessionDetails(null);
        setError(null);
        setRemoteStreamUrlState(null);
    }, []);

    const appendTranscript = useCallback((role: VoiceRole, text: string) => {
        const entry = createTranscriptEntry(role, text);
        if (!entry) return;

        setTranscripts((prev) => [...prev, entry]);
    }, []);

    const cleanup = useCallback(() => {
        try {
            if (dataChannelRef.current) {
                try {
                    (dataChannelRef.current as unknown as { close: () => void }).close();
                } catch (channelError) {
                    console.warn("Failed to close data channel", channelError);
                }
            }

            if (peerConnectionRef.current) {
                try {
                    (peerConnectionRef.current as unknown as { close: () => void }).close();
                } catch (pcError) {
                    console.warn("Failed to close peer connection", pcError);
                }
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            if (remoteStreamRef.current) {
                remoteStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            // Stop InCallManager and restore normal audio routing
            InCallManager.stop();
        } finally {
            dataChannelRef.current = null;
            dataChannelReadyRef.current = false;
            peerConnectionRef.current = null;
            localStreamRef.current = null;
            remoteStreamRef.current = null;
            setRemoteStreamUrlState(null);
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (statusRef.current === "idle") {
            return;
        }

        updateStatus("disconnecting");
        cleanup();
        updateStatus("idle");
        resetState();
    }, [cleanup, resetState, updateStatus]);

    const handleRealtimeEvent = useCallback(
        (rawEvent: string) => {
            let payload: any;
            try {
                payload = JSON.parse(rawEvent);
            } catch (parseError) {
                console.warn("Unable to parse realtime event", parseError);
                return;
            }

            const eventType = payload?.type;
            if (!eventType) {
                return;
            }

            switch (eventType) {
                case "input_audio_buffer.speech_started":
                    setIsUserSpeaking(true);
                    break;
                case "input_audio_buffer.speech_partial":
                    if (typeof payload.transcript === "string") {
                        userBufferRef.current = payload.transcript;
                    }
                    break;
                case "input_audio_buffer.speech_finalized":
                    setIsUserSpeaking(false);
                    if (typeof payload.transcript === "string") {
                        appendTranscript("user", payload.transcript);
                    } else if (userBufferRef.current) {
                        appendTranscript("user", userBufferRef.current);
                    }
                    userBufferRef.current = "";
                    break;
                case "input_audio_buffer.speech_stopped":
                    setIsUserSpeaking(false);
                    break;
                case "response.output_audio.delta":
                    setIsAssistantSpeaking(true);
                    break;
                case "response.output_text.delta":
                    setIsAssistantSpeaking(true);
                    if (typeof payload.delta === "string") {
                        assistantBufferRef.current += payload.delta;
                        setPartialAssistantText(assistantBufferRef.current);
                    }
                    break;
                case "response.output_audio.done":
                case "response.completed":
                    setIsAssistantSpeaking(false);
                    break;
                case "response.output_text.done":
                    if (assistantBufferRef.current) {
                        appendTranscript("assistant", assistantBufferRef.current);
                        assistantBufferRef.current = "";
                        setPartialAssistantText("");
                    }
                    setIsAssistantSpeaking(false);
                    break;
                case "response.requires_action":
                    void resolveToolCalls(payload);
                    break;
                case "response.error":
                case "session.error":
                    if (payload.error?.message) {
                        setError(payload.error.message);
                    }
                    break;
                default:
                    break;
            }
        },
        [appendTranscript, resolveToolCalls]
    );

    const connect = useCallback(async () => {
        if (
            statusRef.current === "connecting" ||
            statusRef.current === "connected"
        ) {
            return;
        }

        updateStatus("connecting");
        setError(null);
        setTranscripts([]);
        setPartialAssistantText("");

        let localStream: MediaStream | null = null;
        let peer: RTCPeerConnection | null = null;

        try {
            localStream = await mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            localStreamRef.current = localStream;

            peer = new RTCPeerConnection({
                iceServers: ICE_SERVERS,
            });
            peerConnectionRef.current = peer;

            localStream.getTracks().forEach((track) => {
                peer?.addTrack(track, localStream as MediaStream);
            });

            const rawChannel = peer.createDataChannel("oai-events");
            const channel = rawChannel as any;
            dataChannelRef.current = channel;
            dataChannelReadyRef.current = channel.readyState === "open";

            channel.onmessage = (event: { data: unknown }) => {
                if (typeof event?.data === "string") {
                    handleRealtimeEvent(event.data);
                }
            };

            channel.onerror = (channelError: unknown) => {
                console.error("Realtime data channel error", channelError);
                setError("Voice channel error");
            };

            channel.onopen = () => {
                dataChannelReadyRef.current = true;
            };

            channel.onclose = () => {
                dataChannelReadyRef.current = false;
                if (statusRef.current === "connected") {
                    setError("Voice session ended");
                    void disconnect();
                }
            };

            const typedPeer = peer as unknown as {
                ontrack: ((event: { streams: MediaStream[] }) => void) | null;
                onconnectionstatechange: (() => void) | null;
            };

            typedPeer.ontrack = (event) => {
                const [stream] = event.streams;
                if (stream) {
                    remoteStreamRef.current = stream;
                    if (typeof (stream as any)?.toURL === "function") {
                        setRemoteStreamUrlState((stream as any).toURL());
                    } else {
                        setRemoteStreamUrlState(null);
                    }

                    // Route audio to speaker for voice assistant
                    InCallManager.start({ media: "audio", ringback: "" });
                    InCallManager.setForceSpeakerphoneOn(true);
                }
            };

            typedPeer.onconnectionstatechange = () => {
                const state = peer?.connectionState;
                switch (state) {
                    case "connected":
                        updateStatus("connected");
                        break;
                    case "disconnected":
                    case "failed":
                        setError("Voice session disconnected");
                        void disconnect();
                        break;
                    case "closed":
                        void disconnect();
                        break;
                    default:
                        break;
                }
            };

            const token: RealtimeTokenResponse = await getRealtimeToken({
                language,
                instructions,
            });

            setSessionDetails({
                model: token.model,
                voice: token.voice,
                language: token.language as "en" | "hi",
                expiresAt: token.expires_at,
            });

            const offer = await peer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false,
            });
            await peer.setLocalDescription(offer);
            await waitForIceGathering(peer);

            const response = await fetch(
                `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
                    token.model
                )}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token.client_secret}`,
                        "Content-Type": "application/sdp",
                    },
                    body: peer.localDescription?.sdp ?? "",
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || "Failed to establish realtime voice session"
                );
            }

            const answer = await response.text();
            const remoteDescription = new RTCSessionDescription({
                type: "answer",
                sdp: answer,
            });
            await peer.setRemoteDescription(remoteDescription);

            setIsMuted(false);
        } catch (connectionError) {
            console.error("Failed to start realtime voice session", connectionError);
            setError(
                connectionError instanceof Error
                    ? connectionError.message
                    : "Unable to start voice session"
            );
            cleanup();
            updateStatus("error");
            throw connectionError;
        }
    }, [cleanup, disconnect, handleRealtimeEvent, instructions, language, updateStatus]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        setIsMuted((prev) => {
            const next = !prev;
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !next;
            });
            return next;
        });
    }, []);

    useEffect(
        () => () => {
            void disconnect();
        },
        [disconnect]
    );

    const memoisedResult = useMemo<UseRealtimeVoiceResult>(
        () => ({
            status,
            transcripts,
            partialAssistantText,
            isMuted,
            isAssistantSpeaking,
            isUserSpeaking,
            error,
            sessionDetails,
            connect,
            disconnect,
            toggleMute,
            remoteStreamUrl: remoteStreamUrlState,
        }),
        [
            connect,
            disconnect,
            error,
            isAssistantSpeaking,
            isMuted,
            isUserSpeaking,
            partialAssistantText,
            remoteStreamUrlState,
            sessionDetails,
            status,
            toggleMute,
            transcripts,
        ]
    );

    return memoisedResult;
}
