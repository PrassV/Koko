"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { MapPin, Building, Home, ArrowLeft, Ruler, Compass, Calendar, Plus, FileText, Download, Wrench, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Types based on our backend models
interface Unit {
    id: number;
    unit_number: string;
    size_sqft?: number;
    facing?: string;
    construction_date?: string;
    specifications?: any;
    status: string;
}

interface Property {
    id: number;
    name: string;
    address: string;
    images?: string[];
    description: string;
    property_type: string;
    units_count: number;
    location_lat: number;
    location_lng: number;
    amenities?: string[];
    documents?: { name: string, url: string }[];
    units: Unit[];
}

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'photos' | 'map'>('photos');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    });

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await api.get(`/properties/${id}`);
                setProperty(res.data);
                // Default to map if no photos
                if (res.data.images && res.data.images.length > 0) {
                    setActiveTab('photos');
                } else {
                    setActiveTab('map');
                }
            } catch (err) {
                console.error("Failed to fetch property", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProperty();
    }, [id]);

    if (loading) return <div className="p-10 text-white flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent"></div></div>;
    if (!property) return <div className="p-10 text-white">Property not found.</div>;

    const mapCenter = {
        lat: property.location_lat || 40.7128,
        lng: property.location_lng || -74.0060
    };

    const hasPhotos = property.images && property.images.length > 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header / Back */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-slate-400 hover:text-white pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={() => router.push(`/owner/properties/${id}/maintenance`)}>
                        <Wrench className="mr-2 h-4 w-4" /> Maintenance
                    </Button>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-black" onClick={() => router.push(`/owner/properties/${id}/units/create`)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Unit
                    </Button>
                </div>
            </div>

            {/* Top Banner Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Visual (Map or Photos) */}
                <GlassCard className="lg:col-span-2 p-0 overflow-hidden relative group h-[400px]">
                    <div className="absolute top-4 right-4 z-20 flex gap-2 bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10">
                        {hasPhotos && (
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`p-2 rounded-md transition-all ${activeTab === 'photos' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`p-2 rounded-md transition-all ${activeTab === 'map' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                        >
                            <MapPin className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="w-full h-full bg-slate-800 relative">
                        {activeTab === 'map' ? (
                            isLoaded && property.location_lat ? (
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
                            )
                        ) : (
                            // Photo Carousel
                            <div className="w-full h-full relative bg-black">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentPhotoIndex}
                                        src={property.images![currentPhotoIndex]}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full h-full object-cover"
                                        alt={`Property View ${currentPhotoIndex + 1}`}
                                    />
                                </AnimatePresence>
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                {/* Controls */}
                                {property.images!.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => (prev - 1 + property.images!.length) % property.images!.length); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-amber-500/80 hover:text-black transition-all"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => (prev + 1) % property.images!.length); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-amber-500/80 hover:text-black transition-all"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                            <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">{property.name}</h1>
                            <p className="text-slate-200 flex items-center text-sm drop-shadow-md">
                                <MapPin className="h-3 w-3 mr-1 text-amber-400" /> {property.address}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Stats & Info */}
                <div className="space-y-6 flex flex-col">
                    <GlassCard className="p-6 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-slate-400 block mb-1">Type</span>
                                <span className="text-white font-medium flex items-center truncate">
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
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block mb-2">Description</span>
                            <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                                {property.description || "No description provided."}
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Content Split: Amenities/Docs & Units */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar: Amenities & Docs */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
                        {property.amenities && property.amenities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {property.amenities.map(amenity => (
                                    <span key={amenity} className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs font-medium">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic">No amenities listed.</p>
                        )}
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
                        {property.documents && property.documents.length > 0 ? (
                            <div className="space-y-2">
                                {property.documents.map((doc, i) => (
                                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                            <span className="text-sm text-slate-300 truncate group-hover:text-white">{doc.name}</span>
                                        </div>
                                        <Download className="h-3 w-3 text-slate-500 group-hover:text-white" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic">No documents uploaded.</p>
                        )}
                    </GlassCard>
                </div>

                {/* Right Area: Units */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Units</h2>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-400 border border-white/10">{property.units ? property.units.length : 0} Total</span>
                    </div>

                    {property.units && property.units.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {property.units.map(unit => (
                                <motion.div
                                    key={unit.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <GlassCard className="p-4 hover:border-amber-500/30 transition-colors group cursor-pointer relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                                                {unit.unit_number}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs border font-medium ${unit.status === 'OCCUPIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    unit.status === 'VACANT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }`}>
                                                {unit.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm relative z-10">
                                            {unit.size_sqft && (
                                                <div className="flex items-center text-slate-400">
                                                    <Ruler className="h-3 w-3 mr-2 text-slate-500" /> {unit.size_sqft} sq ft
                                                </div>
                                            )}
                                            {unit.facing && (
                                                <div className="flex items-center text-slate-400">
                                                    <Compass className="h-3 w-3 mr-2 text-slate-500" /> {unit.facing} Facing
                                                </div>
                                            )}
                                            {unit.construction_date && (
                                                <div className="flex items-center text-slate-400">
                                                    <Calendar className="h-3 w-3 mr-2 text-slate-500" /> Built {format(new Date(unit.construction_date), 'yyyy')}
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <p className="text-slate-500 mb-4">No units added yet.</p>
                            <Button variant="outline" onClick={() => router.push(`/owner/properties/${id}/units/create`)} className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                                Create First Unit
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
