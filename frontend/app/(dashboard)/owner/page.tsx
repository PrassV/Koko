"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Counter } from "@/components/ui/counter";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, DollarSign, ArrowUpRight } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function OwnerDashboard() {
    const { profile } = useAuth();
    const userName = profile?.name || "Owner";

    // Stats State
    const [stats, setStats] = useState({
        total_properties: 0,
        active_tenants: 0,
        monthly_revenue: 0,
        occupancy_rate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/owner/stats");
                setStats(res.data);
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 p-1">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col space-y-2"
            >
                <h1 className="text-4xl font-bold tracking-tight text-white">
                    Welcome back, <span className="text-gradient">{userName}</span>
                </h1>
                <p className="text-slate-400 text-lg">Here's what's happening with your portfolio today.</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-3"
            >
                <motion.div variants={item}>
                    <GlassCard gradient className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building2 size={100} />
                        </div>
                        <div className="flex flex-col space-y-2 relative z-10">
                            <span className="text-slate-400 font-medium">Total Properties</span>
                            <div className="text-4xl font-bold text-white flex items-baseline">
                                <Counter value={stats.total_properties} />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                    <GlassCard gradient className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={100} />
                        </div>
                        <div className="flex flex-col space-y-2 relative z-10">
                            <span className="text-slate-400 font-medium">Active Tenants</span>
                            <div className="text-4xl font-bold text-white flex items-baseline">
                                <Counter value={stats.active_tenants} />
                                <span className="text-sm font-normal text-emerald-400 ml-2">
                                    {stats.occupancy_rate}% Occupancy
                                </span>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                    <GlassCard gradient className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={100} />
                        </div>
                        <div className="flex flex-col space-y-2 relative z-10">
                            <span className="text-slate-400 font-medium">Month Revenue</span>
                            <div className="text-4xl font-bold text-white flex items-baseline">
                                $<Counter value={stats.monthly_revenue} />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </motion.div>

            {/* Quick Actions / Recent Activity (Placeholder for next step) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
            >
                <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-4">
                    {/* Add action buttons here later */}
                </div>
            </motion.div>
        </div>
    )
}
