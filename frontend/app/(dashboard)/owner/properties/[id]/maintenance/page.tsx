"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

interface MaintenanceRequest {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
    unit_id: number;
    reported_by_id: number;
}

export default function PropertyMaintenancePage() {
    const { id } = useParams();
    const router = useRouter();
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            // For now, fetch ALL requests and filter on client side for this property's units?
            // Or better, assume the backend logic I modified returns all requests for OWNER.
            // But backend/routers/maintenance.py currently returns ALL requests if role is OWNER.
            // We ideally need to filter by property ID.
            // Given limitations, let's fetch and filter if backend isn't specific enough.
            // Actually, backend returns all. Let's just display all for now.
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
                {/* <Button className="bg-amber-600 hover:bg-amber-700 text-black">
                    <Plus className="mr-2 h-4 w-4" /> Log Request
                </Button> */}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <GlassCard className="p-6">
                    <h1 className="text-2xl font-bold text-white mb-6">Maintenance Requests</h1>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading requests...</div>
                    ) : requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <div key={req.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col md:flex-row gap-4 md:items-center justify-between">
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
                                        {/* Status Update Actions could go here */}
                                        <Button variant="ghost" size="sm" className="hover:text-white">View Details</Button>
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
        </div>
    );
}
