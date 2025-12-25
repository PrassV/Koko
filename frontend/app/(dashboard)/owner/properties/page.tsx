"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Building } from "lucide-react";
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
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
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
                            <GlassCard className="h-full flex flex-col p-6 group cursor-pointer hover:border-blue-500/50 transition-colors">
                                <div className="mb-4 p-3 bg-blue-500/10 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors">
                                    <Building className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{prop.name}</h3>
                                <div className="flex items-start text-slate-400 text-sm mb-4">
                                    <MapPin className="h-4 w-4 mr-1 mt-0.5 shrink-0" />
                                    <span>{prop.address}</span>
                                </div>
                                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                                    {prop.description || "No description provided."}
                                </p>
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Units: --</span>
                                    <span className="text-blue-400 font-medium group-hover:underline">View Details -&gt;</span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
