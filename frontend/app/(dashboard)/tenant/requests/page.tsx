"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wrench, Plus, Circle, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface MaintenanceReq {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at?: string;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<MaintenanceReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "" });
    const [submitting, setSubmitting] = useState(false);

    // Assuming we can get unit_id from context or a separate call. 
    // For MVP, we might hardcode or fetch. Ideally, the backend knows the tenant's active unit.
    // But the backend `RequestCreate` expects `unit_id`.
    // Let's fetch the lease first to get unit_id.
    const [unitId, setUnitId] = useState<number | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Get lease to find unit ID
                const leaseRes = await api.get("/tenancy/me");
                setUnitId(leaseRes.data.unit_id);

                // Get requests
                const reqRes = await api.get("/maintenance/");
                setRequests(reqRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitId) {
            toast.error("No active unit found to raise request against.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post("/maintenance/", {
                ...formData,
                unit_id: unitId
            });
            setRequests([res.data, ...requests]);
            setShowForm(false);
            setFormData({ title: "", description: "" });
            toast.success("Request submitted");
        } catch (err) {
            toast.error("Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Maintenance</h1>
                    <p className="text-slate-400">Report and track issues.</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-amber-600 hover:bg-amber-700 text-black"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Request
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-6 border-amber-500/30 bg-amber-500/5 mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4">Describe the issue</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Title</Label>
                                    <Input
                                        placeholder="e.g. Leaking Faucet"
                                        className="bg-black/20 border-white/10 text-white"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Description</Label>
                                    <Textarea
                                        placeholder="Details about the problem..."
                                        className="bg-black/20 border-white/10 text-white min-h-[100px]"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
                                    <Button type="submit" disabled={submitting}>Submit Ticket</Button>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                {requests.length === 0 && !showForm ? (
                    <div className="text-center py-12 text-slate-500">
                        <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No maintenance requests found.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <GlassCard key={req.id} className="p-6 flex items-start gap-4 hover:bg-white/5 transition-colors">
                            <div className={`p-3 rounded-full mt-1 ${req.status === 'OPEN' ? 'bg-yellow-500/10 text-yellow-500' :
                                req.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                    'bg-amber-500/10 text-amber-500'
                                }`}>
                                {req.status === 'OPEN' ? <Clock className="h-5 w-5" /> :
                                    req.status === 'RESOLVED' ? <CheckCircle className="h-5 w-5" /> :
                                        <Wrench className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold text-white">{req.title}</h3>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full border border-white/10 text-slate-400 capitalize">
                                        {req.status.toLowerCase()}
                                    </span>
                                </div>
                                <p className="text-slate-400 mt-1 text-sm">{req.description}</p>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
