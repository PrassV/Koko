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
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Add Property
                    </Button>
                </Link>
            </motion.div>

            {properties.length === 0 ? (
                <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4 border-dashed border-2 border-border/50">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Building className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium text-foreground">No properties yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Get started by adding your first property to track units, tenants, and finances.
                    </p>
                    <Link href="/owner/properties/create">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
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
                                <GlassCard className="h-full flex flex-col p-6 group cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <Building className="h-6 w-6" />
                                        </div>
                                        {/* Status Badge Placeholder */}
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                            Active
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-2">{prop.name}</h3>

                                    <div className="space-y-2 mb-6 flex-1">
                                        <p className="text-muted-foreground text-sm flex items-start">
                                            <MapPin className="h-4 w-4 mr-2 text-primary/70 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{prop.address}</span>
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                        <span>Click to view details</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
