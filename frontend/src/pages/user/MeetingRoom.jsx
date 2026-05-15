import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check, Captions, CaptionsOff, Loader2, Circle, Square } from "lucide-react";
import Peer from "peerjs";
import { useAuth } from "../../context/AuthContext";
import { roomsApi } from "../../api/rooms";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1";

function VideoTile({ stream, label, muted = false }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && stream) ref.current.srcObject = stream;
    }, [stream]);
    return (
        <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {stream ? (
                <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
            ) : (
                <div className="text-slate-500 text-sm">No video</div>
            )}
            {label && (
                <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded">
                    {label}
                </span>
            )}
        </div>
    );
}

// Status pill shown in top bar during recording / transcribing
function StatusPill({ recording, transcribing }) {
    if (transcribing) {
        return (
            <div className="flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs px-3 py-1 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" />
                Transcribing — please wait…
            </div>
        );
    }
    if (recording) {
        return (
            <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 text-red-400 text-xs px-3 py-1 rounded-full animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                Recording — click Stop to transcribe
            </div>
        );
    }
    return null;
}

export default function MeetingRoom() {
    const [params] = useSearchParams();
    const code = params.get("code") || "";
    const navigate = useNavigate();
    const { user } = useAuth();

    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [audioOn, setAudioOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    // Captions
    const [captionsOn, setCaptionsOn] = useState(false);
    const [captions, setCaptions] = useState([]);
    const recognitionRef = useRef(null);
    const captionTimerRef = useRef({});

    // Recording + transcription
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);

    const peerRef = useRef(null);
    const wsRef = useRef(null);
    const callsRef = useRef({});
    const localStreamRef = useRef(null);

    const addPeer = useCallback((id, stream, name) => {
        setPeers((prev) => ({ ...prev, [id]: { stream, name } }));
    }, []);

    const removePeer = useCallback((id) => {
        setPeers((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    // ── Caption helpers ───────────────────────────────────────────────────────
    const addCaption = useCallback((id, speaker, text) => {
        setCaptions((prev) => {
            const filtered = prev.filter((c) => c.id !== id);
            return [...filtered.slice(-4), { id, speaker, text }];
        });
        if (captionTimerRef.current[id]) clearTimeout(captionTimerRef.current[id]);
        captionTimerRef.current[id] = setTimeout(() => {
            setCaptions((prev) => prev.filter((c) => c.id !== id));
            delete captionTimerRef.current[id];
        }, 5000);
    }, []);

    const startCaptions = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        const myId = "local-caption";
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
            addCaption(myId, user?.name || "You", transcript);
            if (e.results[e.results.length - 1].isFinal && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ event: "caption", text: transcript, speaker: user?.name || "You" }));
            }
        };
        rec.onerror = () => {};
        rec.start();
        recognitionRef.current = rec;
        setCaptionsOn(true);
    }, [user, addCaption]);

    const stopCaptions = useCallback(() => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setCaptionsOn(false);
    }, []);

    const toggleCaptions = useCallback(() => {
        captionsOn ? stopCaptions() : startCaptions();
    }, [captionsOn, startCaptions, stopCaptions]);

    // ── WebRTC setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!code || !user) return;
        let cancelled = false;

        const token = localStorage.getItem("token");

        roomsApi.getRoom(code).catch(() => {
            setError("Room not found or no longer active.");
        });

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
                localStreamRef.current = stream;
                setLocalStream(stream);

                const peer = new Peer({
                    config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
                });
                peerRef.current = peer;

                peer.on("open", (myPeerId) => {
                    if (cancelled) return;

                    const ws = new WebSocket(`${WS_BASE}/rooms/${code}/ws?token=${token}`);
                    wsRef.current = ws;

                    ws.onmessage = (e) => {
                        const msg = JSON.parse(e.data);

                        if (msg.event === "peer-joined") {
                            ws.send(JSON.stringify({ event: "peer-id", peerId: myPeerId, name: user.name }));
                        }
                        if (msg.event === "peer-id" && msg.peerId !== myPeerId) {
                            const call = peer.call(msg.peerId, stream, { metadata: { name: user.name } });
                            callsRef.current[msg.peerId] = call;
                            call.on("stream", (remoteStream) => addPeer(msg.peerId, remoteStream, msg.name));
                            call.on("close", () => removePeer(msg.peerId));
                        }
                        if (msg.event === "peer-left") {
                            callsRef.current[msg.peerId]?.close();
                            delete callsRef.current[msg.peerId];
                            removePeer(msg.peerId);
                        }
                        if (msg.event === "caption" && msg.speaker && msg.text) {
                            addCaption(`remote-${msg.speaker}`, msg.speaker, msg.text);
                        }
                    };

                    ws.onclose = () => {
                        if (!cancelled) setError("Disconnected from room.");
                    };
                });

                peer.on("call", (call) => {
                    call.answer(stream);
                    callsRef.current[call.peer] = call;
                    call.on("stream", (remoteStream) => addPeer(call.peer, remoteStream, call.metadata?.name || "Guest"));
                    call.on("close", () => removePeer(call.peer));
                });

                peer.on("error", (err) => {
                    if (!cancelled) setError(`Connection error: ${err.type}`);
                });
            })
            .catch(() => setError("Could not access camera or microphone."));

        return () => {
            cancelled = true;
            recognitionRef.current?.stop();
            recorderRef.current?.state === "recording" && recorderRef.current.stop();
            wsRef.current?.close();
            peerRef.current?.destroy();
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [code, user, addPeer, removePeer, addCaption]);

    // ── Controls ──────────────────────────────────────────────────────────────
    const toggleAudio = () => {
        localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        setAudioOn((v) => !v);
    };

    const toggleVideo = () => {
        localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setVideoOn((v) => !v);
    };

    const handleLeave = () => {
        recognitionRef.current?.stop();
        wsRef.current?.close();
        peerRef.current?.destroy();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        navigate("/dashboard/join");
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Recording / transcription ─────────────────────────────────────────────
    const startRecording = () => {
        if (!localStreamRef.current) {
            setError("No audio stream available to record.");
            return;
        }
        chunksRef.current = [];

        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length === 0) {
            setError("No microphone track found. Allow microphone access and rejoin.");
            return;
        }

        // Record audio-only to avoid codec issues with mixed video+audio streams.
        const audioStream = new MediaStream(audioTracks);

        const supportedMime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
            .find((m) => MediaRecorder.isTypeSupported(m));

        let recorder;
        try {
            recorder = supportedMime
                ? new MediaRecorder(audioStream, { mimeType: supportedMime })
                : new MediaRecorder(audioStream);
            recorder.start(1000);
        } catch (err) {
            setError(`Recording failed to start: ${err.message}`);
            return;
        }
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorderRef.current = recorder;
        setRecording(true);
    };

    const stopAndTranscribe = () => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state !== "recording") return;

        // onstop must be wired before .stop() — some browsers fire it synchronously.
        recorder.onstop = async () => {
            setRecording(false);
            setTranscribing(true);
            try {
                if (chunksRef.current.length === 0) {
                    throw new Error("No audio data recorded.");
                }
                const mimeType = recorder.mimeType || "audio/webm";
                const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const form = new FormData();
                form.append("file", blob, `recording.${ext}`);
                const { data } = await roomsApi.transcribe(code, form);
                if (data.task_count > 0) {
                    navigate("/dashboard/tasks");
                } else {
                    navigate(`/dashboard/notes?highlight=${data.note_id}`);
                }
            } catch (err) {
                setError(`Transcription failed: ${err?.response?.data?.detail || err?.message || "unknown error"}`);
                setTranscribing(false);
            }
        };
        recorder.stop();
    };

    const allStreams = [
        { id: "local", stream: localStream, label: `${user?.name} (you)`, muted: true },
        ...Object.entries(peers).map(([id, { stream, name }]) => ({ id, stream, label: name, muted: false })),
    ];

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">MeetMind</span>

                <StatusPill recording={recording} transcribing={transcribing} />

                <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="font-mono">{code}</span>
                </button>
            </div>

            {/* Video grid */}
            <div className="flex-1 p-4 overflow-auto relative">
                {error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/join")}>
                                Back
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={cn(
                            "grid gap-3 h-full",
                            allStreams.length === 1 && "grid-cols-1 max-w-2xl mx-auto",
                            allStreams.length === 2 && "grid-cols-2",
                            allStreams.length >= 3 && "grid-cols-2 sm:grid-cols-3",
                        )}>
                            {allStreams.map(({ id, stream, label, muted }) => (
                                <VideoTile key={id} stream={stream} label={label} muted={muted} />
                            ))}
                        </div>

                        {/* Live captions overlay */}
                        {captions.length > 0 && (
                            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 items-center pointer-events-none">
                                {captions.map(({ id, speaker, text }) => (
                                    <div key={id} className="bg-black/70 text-white text-sm px-3 py-1.5 rounded-lg max-w-xl text-center">
                                        <span className="text-slate-400 text-xs mr-1">{speaker}:</span>
                                        {text}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Transcribing full-screen overlay */}
                        {transcribing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
                                <div className="flex flex-col items-center gap-3 text-white">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                    <p className="text-sm font-medium">Transcribing your meeting…</p>
                                    <p className="text-xs text-slate-400">Extracting tasks and saving notes</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-3 py-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    {/* Mic */}
                    <ControlButton
                        onClick={toggleAudio}
                        active={audioOn}
                        label={audioOn ? "Mute" : "Unmute"}
                    >
                        {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </ControlButton>

                    {/* Camera */}
                    <ControlButton
                        onClick={toggleVideo}
                        active={videoOn}
                        label={videoOn ? "Stop video" : "Start video"}
                    >
                        {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </ControlButton>

                    {/* Captions */}
                    <ControlButton
                        onClick={toggleCaptions}
                        active={captionsOn}
                        activeColor="bg-indigo-600 hover:bg-indigo-500"
                        label={captionsOn ? "Hide captions" : "Show captions"}
                    >
                        {captionsOn ? <Captions className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
                    </ControlButton>

                    {/* Record / Stop */}
                    <ControlButton
                        onClick={recording ? stopAndTranscribe : startRecording}
                        disabled={transcribing}
                        active={recording}
                        activeColor="bg-red-600 hover:bg-red-500 animate-pulse"
                        label={recording ? "Stop & transcribe" : "Start recording"}
                    >
                        {recording
                            ? <Square className="h-4 w-4 fill-current" />
                            : <Circle className="h-5 w-5" />
                        }
                    </ControlButton>

                    {/* Leave */}
                    <button
                        onClick={handleLeave}
                        title="Leave meeting"
                        className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                    >
                        <PhoneOff className="h-5 w-5" />
                    </button>
                </div>

                {/* Hint text under controls */}
                <p className="text-xs text-slate-500 h-4">
                    {recording && "Speaking? Your audio is being recorded."}
                    {!recording && !transcribing && "Click the record button to capture the meeting."}
                </p>
            </div>
        </div>
    );
}

function ControlButton({ onClick, active, activeColor, label, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            className={cn(
                "h-11 w-11 rounded-full flex items-center justify-center transition-colors text-white",
                active
                    ? (activeColor || "bg-slate-500 hover:bg-slate-400")
                    : "bg-slate-700 hover:bg-slate-600",
                disabled && "opacity-40 cursor-not-allowed",
            )}
        >
            {children}
        </button>
    );
}
