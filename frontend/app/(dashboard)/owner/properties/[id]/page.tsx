"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { MapPin, Building, Home, ArrowLeft, Ruler, Compass, Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

// Types based on our backend models
interface Unit {
    id: number;
    unit_number: string;
    size_sqft?: number;
    facing?: string;
    construction_date?: string;
    specifications?: any;
}

interface Property {
    id: number;
    name: string;
    address: string;
    description: string;
    property_type: string;
    units_count: number;
    location_lat: number;
    location_lng: number;
    units: Unit[];
}

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    });

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await api.get(`/properties/${id}`);
                setProperty(res.data);
            } catch (err) {
                console.error("Failed to fetch property", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProperty();
    }, [id]);

    if (loading) return <div className="p-10 text-white">Loading details...</div>;
    if (!property) return <div className="p-10 text-white">Property not found.</div>;

    const mapCenter = {
        lat: property.location_lat || 40.7128,
        lng: property.location_lng || -74.0060
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header / Back */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-slate-400 hover:text-white pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-700 text-black" onClick={() => router.push(`/owner/properties/${id}/units/create`)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Unit
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <GlassCard className="md:col-span-2 p-0 overflow-hidden flex flex-col">
                    <div className="h-64 bg-slate-800 relative">
                        {isLoaded && property.location_lat ? (
                            <GoogleMap
                                zoom={15}
                                center={mapCenter}
                                mapContainerClassName="w-full h-full"
                                options={{ disableDefaultUI: true, zoomControl: true }}
                            >
                                <Marker position={mapCenter} />
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-white/5">
                                <MapPin className="h-8 w-8 mb-2" />
                                <span className="block">No Map Data</span>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <h1 className="text-3xl font-bold text-white mb-1">{property.name}</h1>
                            <p className="text-slate-300 flex items-center text-sm">
                                <MapPin className="h-3 w-3 mr-1" /> {property.address}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-slate-400 block mb-1">Type</span>
                                <span className="text-white font-medium flex items-center">
                                    <Building className="h-4 w-4 mr-2 text-amber-400" />
                                    {property.property_type || "N/A"}
                                </span>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-slate-400 block mb-1">Total Units</span>
                                <span className="text-white font-medium flex items-center">
                                    <Home className="h-4 w-4 mr-2 text-yellow-400" />
                                    {property.units_count}
                                </span>
                            </div>
                            {/* We could add logic to aggregate sqft or other stats here if available on property level */}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {property.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Side Stats / Docs Placeholder */}
                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Occupancy</span>
                                <span className="text-emerald-400 font-bold">85%</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Revenue (YTD)</span>
                                <span className="text-white font-bold">$124,500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Pending Requests</span>
                                <span className="text-yellow-400 font-bold">2</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Units List */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Units</h2>
                {property.units && property.units.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {property.units.map(unit => (
                            <motion.div
                                key={unit.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <GlassCard className="p-4 hover:border-amber-500/30 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                                            {unit.unit_number}
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Occupied
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {unit.size_sqft && (
                                            <div className="flex items-center text-slate-400">
                                                <Ruler className="h-3 w-3 mr-2" /> {unit.size_sqft} sq ft
                                            </div>
                                        )}
                                        {unit.facing && (
                                            <div className="flex items-center text-slate-400">
                                                <Compass className="h-3 w-3 mr-2" /> {unit.facing} Facing
                                            </div>
                                        )}
                                        {unit.construction_date && (
                                            <div className="flex items-center text-slate-400">
                                                <Calendar className="h-3 w-3 mr-2" /> Built {format(new Date(unit.construction_date), 'yyyy')}
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                        <p className="text-slate-500 mb-4">No units added yet.</p>
                        <Button variant="outline" onClick={() => router.push(`/owner/properties/${id}/units/create`)}>
                            Create First Unit
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
