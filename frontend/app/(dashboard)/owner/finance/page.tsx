"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, TrendingUp, Calendar, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Payment {
    id: number;
    amount: number;
    payment_type: string;
    payment_date: string;
    status: string;
}

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

export default function FinancePage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await api.get("/finance/payments");
                setPayments(res.data);
            } catch (err) {
                console.error("Failed to fetch payments", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    // Calculate totals
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const recentPayments = [...payments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    if (loading) return <div className="p-10 text-white">Loading financials...</div>;

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Financial Overview</h1>
                    <p className="text-slate-400">Track your revenue and expenses.</p>
                </div>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-3"
            >
                <motion.div variants={item}>
                    <GlassCard gradient className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-emerald-500/20 rounded-full">
                                <DollarSign className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</h3>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                    <GlassCard className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-500/20 rounded-full">
                                <TrendingUp className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Active Leases</p>
                                <h3 className="text-2xl font-bold text-white">--</h3>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                    <GlassCard className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-500/20 rounded-full">
                                <CreditCard className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Pending Payments</p>
                                <h3 className="text-2xl font-bold text-white">--</h3>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <GlassCard className="overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                    </div>
                    {payments.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No transactions found.</div>
                    ) : (
                        <div className="w-full">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-400">
                                    <tr>
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium">Type</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {recentPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="p-4 capitalize">{payment.payment_type.toLowerCase()}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium text-white">
                                                ${payment.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
}
