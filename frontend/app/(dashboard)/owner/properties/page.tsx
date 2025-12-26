"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Building, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Property {
    id: number;
    name: string;
    address: string;
    description: string;
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

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await api.get("/properties/");
                setProperties(res.data);
            } catch (err) {
                console.error("Failed to fetch properties", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    if (loading) return <div className="p-10 text-white">Loading properties...</div>;

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Properties</h1>
                    <p className="text-slate-400">Manage your real estate portfolio.</p>
                </div>
                <Link href="/owner/properties/create">
                    <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black border-0">
                        <Plus className="mr-2 h-4 w-4" /> Add Property
                    </Button>
                </Link>
            </motion.div>

            {properties.length === 0 ? (
                <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-white/5 rounded-full">
                        <Building className="h-12 w-12 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white">No properties yet</h3>
                    <p className="text-slate-400 max-w-sm">
                        Get started by adding your first property to track units, tenants, and finances.
                    </p>
                    <Link href="/owner/properties/create">
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                            Create Property
                        </Button>
                    </Link>
                </GlassCard>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {properties.map((prop) => (
                        <motion.div key={prop.id} variants={item}>
                            <Link href={`/owner/properties/${prop.id}`} className="block h-full">
                                <GlassCard className="h-full flex flex-col p-6 group cursor-pointer hover:border-amber-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-600/20 rounded-xl text-amber-400 group-hover:bg-amber-600 group-hover:text-black transition-colors">
                                            <Building className="h-6 w-6" />
                                        </div>
                                        {/* Status Badge Placeholder */}
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Active
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{prop.name}</h3>

                                    <div className="space-y-2 mb-6 flex-1">
                                        <p className="text-slate-400 text-sm flex items-start">
                                            <MapPin className="h-4 w-4 mr-2 text-slate-500 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{prop.address}</span>
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-400">
                                        <span>Click to view details</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-white" />
                                    </div>
                                </GlassCard>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
