"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Home, Calendar, DollarSign, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Tenancy {
    id: number;
    unit_id: number;
    start_date: string;
    end_date: string;
    rent_amount: number;
    status: string;
}

export default function MyUnitPage() {
    const [tenancy, setTenancy] = useState<Tenancy | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenancy = async () => {
            try {
                const res = await api.get("/tenancy/me");
                setTenancy(res.data);
            } catch (err) {
                console.error("Failed to fetch tenancy", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTenancy();
    }, []);

    if (loading) return <div className="p-10 text-white">Loading lease details...</div>;

    if (!tenancy) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <GlassCard className="p-8">
                    <Home className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Active Lease</h3>
                    <p className="text-slate-400">You are not currently assigned to any unit.</p>
                    <p className="text-sm text-slate-500">Please contact your property manager.</p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-white mb-2">My Unit</h1>
                <p className="text-slate-400">Lease details and unit information.</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
                <GlassCard className="p-6 md:col-span-2 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-blue-500/20 rounded-full">
                            <Home className="h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Unit #{tenancy.unit_id}</h2>
                            <p className="text-slate-400">Active Lease</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-emerald-400" /> Rent Details
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-slate-400">Monthly Rent</span>
                            <span className="text-xl font-bold text-white">${tenancy.rent_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Status</span>
                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase text-xs font-bold">
                                {tenancy.status}
                            </span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-purple-400" /> Lease Term
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Start Date</span>
                            <span className="text-white">{format(new Date(tenancy.start_date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">End Date</span>
                            <span className="text-white">
                                {tenancy.end_date ? format(new Date(tenancy.end_date), 'MMM dd, yyyy') : 'Month-to-Month'}
                            </span>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="flex justify-end">
                <Button variant="destructive" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">
                    Request to Vacate
                </Button>
            </div>
        </div>
    );
}
