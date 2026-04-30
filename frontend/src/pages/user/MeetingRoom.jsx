import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check } from "lucide-react";
import Peer from "peerjs";
import { useAuth } from "../../context/AuthContext";
import { roomsApi } from "../../api/rooms";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const WS_BASE = "ws://localhost:8000/api/v1";

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

export default function MeetingRoom() {
    const [params] = useSearchParams();
    const code = params.get("code") || "";
    const navigate = useNavigate();
    const { user } = useAuth();

    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({}); // peerId -> { stream, name }
    const [audioOn, setAudioOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

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

    useEffect(() => {
        if (!code || !user) return;
        let cancelled = false;

        const token = localStorage.getItem("token");

        // Verify room exists before setting up media
        roomsApi.getRoom(code).catch(() => {
            setError("Room not found or no longer active.");
        });

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
                localStreamRef.current = stream;
                setLocalStream(stream);

                // PeerJS — use public STUN only, no paid PeerJS cloud
                const peer = new Peer({
                    config: {
                        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    },
                });
                peerRef.current = peer;

                peer.on("open", (myPeerId) => {
                    if (cancelled) return;

                    // Connect to signaling WS
                    const ws = new WebSocket(`${WS_BASE}/rooms/${code}/ws?token=${token}`);
                    wsRef.current = ws;

                    ws.onmessage = (e) => {
                        const msg = JSON.parse(e.data);

                        if (msg.event === "peer-joined") {
                            // Initiate call to the new peer
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
                    };

                    ws.onclose = () => {
                        if (!cancelled) setError("Disconnected from room.");
                    };
                });

                // Answer incoming calls
                peer.on("call", (call) => {
                    call.answer(stream);
                    callsRef.current[call.peer] = call;
                    call.on("stream", (remoteStream) =>
                        addPeer(call.peer, remoteStream, call.metadata?.name || "Guest")
                    );
                    call.on("close", () => removePeer(call.peer));
                });

                peer.on("error", (err) => {
                    if (!cancelled) setError(`Connection error: ${err.type}`);
                });
            })
            .catch(() => setError("Could not access camera or microphone."));

        return () => {
            cancelled = true;
            wsRef.current?.close();
            peerRef.current?.destroy();
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [code, user, addPeer, removePeer]);

    const toggleAudio = () => {
        localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        setAudioOn((v) => !v);
    };

    const toggleVideo = () => {
        localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setVideoOn((v) => !v);
    };

    const handleLeave = () => {
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

    const allStreams = [
        { id: "local", stream: localStream, label: `${user?.name} (you)`, muted: true },
        ...Object.entries(peers).map(([id, { stream, name }]) => ({ id, stream, label: name, muted: false })),
    ];

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">MeetMind</span>
                <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="font-mono">{code}</span>
                </button>
            </div>

            {/* Video grid */}
            <div className="flex-1 p-4 overflow-auto">
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
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 py-4 border-t border-slate-800">
                <button
                    onClick={toggleAudio}
                    className={cn(
                        "h-11 w-11 rounded-full flex items-center justify-center transition-colors",
                        audioOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
                    )}
                >
                    {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={cn(
                        "h-11 w-11 rounded-full flex items-center justify-center transition-colors",
                        videoOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
                    )}
                >
                    {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button
                    onClick={handleLeave}
                    className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                >
                    <PhoneOff className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
