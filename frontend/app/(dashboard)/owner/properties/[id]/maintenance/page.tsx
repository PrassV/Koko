"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, User as UserIcon, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; // Assuming ScrollArea exists or use div with scroll
import { useAuth } from "@/context/AuthContext";

interface MaintenanceRequest {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
    unit_id: number;
    reported_by_id: number;
}

interface Comment {
    id: number;
    content: string;
    user_id: number;
    user_name: string;
    created_at: string;
}

export default function PropertyMaintenancePage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get("/maintenance/");
                setRequests(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    useEffect(() => {
        if (selectedRequest) {
            fetchComments(selectedRequest.id);
        }
    }, [selectedRequest]);

    const fetchComments = async (reqId: number) => {
        setLoadingComments(true);
        try {
            const res = await api.get(`/maintenance/${reqId}/comments`);
            setComments(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedRequest) return;

        try {
            const res = await api.post(`/maintenance/${selectedRequest.id}/comments`, { content: newComment });
            // Add optimistic or rely on response
            setComments([...comments, {
                id: res.data.id,
                content: res.data.content,
                user_id: user?.uid ? 0 : 0, // Backend returns user_id, here just for display
                user_name: "Me", // Simple optimistic update or wait for re-fetch. Actually backend returns structured obj.
                created_at: new Date().toISOString()
            }]);
            // Better: use response fully if it matches structure, or simpler just refetch/append
            // Let's retry fetching to be safe or map response
            // Backend returns full comment object
            const confirmedComment = {
                ...res.data,
                user_name: "Me" // backend response has user_name
            };
            // Replace the last one or append? API returns proper shape now.
            setComments(prev => [...prev, confirmedComment]);

            setNewComment("");
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            case "IN_PROGRESS": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "RESOLVED": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
            case "CLOSED": return "text-slate-400 bg-slate-400/10 border-slate-400/20";
            default: return "text-slate-400";
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-slate-400 hover:text-white pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Property
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <GlassCard className="p-6">
                    <h1 className="text-2xl font-bold text-white mb-6">Maintenance Requests</h1>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading requests...</div>
                    ) : requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <div key={req.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col md:flex-row gap-4 md:items-center justify-between cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {format(new Date(req.created_at), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{req.title}</h3>
                                        <p className="text-slate-400 text-sm">{req.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <Button variant="ghost" size="sm" className="hover:text-white gap-2">
                                            <MessageSquare className="h-4 w-4" /> Chat
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                            <CheckCircle className="h-10 w-10 text-emerald-500/50 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">All systems operational</p>
                            <p className="text-slate-600 text-sm">No active maintenance requests found.</p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Chat Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden backdrop-blur-xl">
                    <DialogHeader className="p-6 border-b border-white/10 bg-black/20">
                        <DialogTitle className="text-xl flex items-center gap-3">
                            {selectedRequest?.title}
                            {selectedRequest && <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</span>}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 mt-2">
                            {selectedRequest?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loadingComments ? (
                            <div className="text-center text-slate-500 py-4">Loading conversation...</div>
                        ) : comments.length === 0 ? (
                            <div className="text-center text-slate-600 py-10">No comments yet. Start the conversation.</div>
                        ) : (
                            comments.map((msg) => (
                                <div key={msg.id} className={`flex flex-col gap-1 ${msg.user_name === 'Me' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 px-4 ${msg.user_name === 'Me' ? 'bg-amber-600/20 text-amber-100 rounded-tr-sm' : 'bg-white/10 text-slate-200 rounded-tl-sm'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-600 px-1">
                                        {msg.user_name} • {format(new Date(msg.created_at), 'p')}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={commentsEndRef} />
                    </div>

                    <div className="p-4 bg-black/40 border-t border-white/10">
                        <form onSubmit={handlePostComment} className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-amber-500/50"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <Button type="submit" size="icon" className="bg-amber-600 text-black hover:bg-amber-700" disabled={!newComment.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
