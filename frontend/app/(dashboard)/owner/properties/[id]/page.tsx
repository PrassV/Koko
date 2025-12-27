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

    if (loading) return <div className="p-10 flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent"></div></div>;
    if (!property) return <div className="p-10 text-foreground">Property not found.</div>;

    const mapCenter = {
        lat: property.location_lat || 40.7128,
        lng: property.location_lng || -74.0060
    };

    const hasPhotos = property.images && property.images.length > 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header / Back */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-border text-foreground hover:bg-slate-50" onClick={() => router.push(`/owner/properties/${id}/maintenance`)}>
                        <Wrench className="mr-2 h-4 w-4" /> Maintenance
                    </Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" onClick={() => router.push(`/owner/properties/${id}/units/create`)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Unit
                    </Button>
                </div>
            </div>

            {/* Top Banner Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Visual (Map or Photos) */}
                <GlassCard className="lg:col-span-2 p-0 overflow-hidden relative group h-[400px] border-none shadow-xl bg-slate-900">
                    <div className="absolute top-4 right-4 z-20 flex gap-2 bg-white/80 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-sm">
                        {hasPhotos && (
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`p-2 rounded-md transition-all ${activeTab === 'photos' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`p-2 rounded-md transition-all ${activeTab === 'map' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}
                        >
                            <MapPin className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="w-full h-full relative">
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
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-100">
                                    <MapPin className="h-8 w-8 mb-2" />
                                    <span className="block">No Map Data</span>
                                </div>
                            )
                        ) : (
                            // Photo Carousel
                            <div className="w-full h-full relative bg-slate-900">
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
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm transition-all"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => (prev + 1) % property.images!.length); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm transition-all"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Title Overlay (Only on Photos/Map card) */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none z-10 bg-gradient-to-t from-black/80 to-transparent">
                            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-md">{property.name}</h1>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {property.highlights && property.highlights.map((h: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold">
                                        {h}
                                    </span>
                                ))}
                            </div>
                            <p className="text-slate-200 flex items-center text-sm drop-shadow-md font-medium">
                                <MapPin className="h-3 w-3 mr-1 text-primary" /> {property.address}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Stats & Info */}
                <div className="space-y-6 flex flex-col">
                    <GlassCard className="p-6 flex-1 bg-white border-border shadow-md">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Overview</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider font-semibold">Type</span>
                                <span className="text-foreground font-bold flex items-center truncate">
                                    <Building className="h-4 w-4 mr-2 text-primary" />
                                    {property.property_type || "N/A"}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider font-semibold">Total Units</span>
                                <span className="text-foreground font-bold flex items-center">
                                    <Home className="h-4 w-4 mr-2 text-primary" />
                                    {property.units_count}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block mb-2 uppercase tracking-tight font-semibold">Description</span>
                            <p className="text-foreground text-sm leading-relaxed line-clamp-6">
                                {property.description || "No description provided."}
                            </p>
                        </div>
                    </GlassCard>

                    {/* Nearby Places Mini Card */}
                    {property.nearby_places && property.nearby_places.length > 0 && (
                        <GlassCard className="p-6 bg-slate-900 border-none text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> What's Nearby
                            </h3>
                            <div className="space-y-3 relative z-10">
                                {property.nearby_places.slice(0, 3).map((place: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-200">{place.name}</span>
                                        <span className="font-mono text-primary text-xs">{place.distance}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* Content Split: Amenities/Docs & Units */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar: Amenities & Docs */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-6 bg-white border-border shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Amenities</h3>
                        {property.amenities && property.amenities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {property.amenities.map(amenity => (
                                    <span key={amenity} className="px-2 py-1 bg-slate-50 text-foreground border border-slate-200 rounded text-xs font-medium">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No amenities listed.</p>
                        )}
                    </GlassCard>

                    {/* House Rules */}
                    {property.house_rules && property.house_rules.length > 0 && (
                        <GlassCard className="p-6 bg-white border-border shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-4">House Rules</h3>
                            <ul className="space-y-2">
                                {property.house_rules.map((rule: string, i: number) => (
                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    )}

                    <GlassCard className="p-6 bg-white border-border shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>
                        {property.documents && property.documents.length > 0 ? (
                            <div className="space-y-2">
                                {property.documents.map((doc, i) => (
                                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                            <span className="text-sm text-foreground truncate group-hover:text-primary">{doc.name}</span>
                                        </div>
                                        <Download className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No documents uploaded.</p>
                        )}
                    </GlassCard>
                </div>

                {/* Right Area: Units */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-foreground">Units</h2>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-muted-foreground border border-slate-200 font-medium">{property.units ? property.units.length : 0} Total</span>
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
                                    <GlassCard className="p-4 bg-white border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-foreground font-bold text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                {unit.unit_number}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs border font-medium ${unit.status === 'OCCUPIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                unit.status === 'VACANT' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                {unit.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm relative z-10">
                                            {unit.size_sqft && (
                                                <div className="flex items-center text-muted-foreground">
                                                    <Ruler className="h-3 w-3 mr-2 text-slate-400" /> {unit.size_sqft} sq ft
                                                </div>
                                            )}
                                            {unit.facing && (
                                                <div className="flex items-center text-muted-foreground">
                                                    <Compass className="h-3 w-3 mr-2 text-slate-400" /> {unit.facing} Facing
                                                </div>
                                            )}
                                            {unit.construction_date && (
                                                <div className="flex items-center text-muted-foreground">
                                                    <Calendar className="h-3 w-3 mr-2 text-slate-400" /> Built {format(new Date(unit.construction_date), 'yyyy')}
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-slate-50">
                            <p className="text-muted-foreground mb-4">No units added yet.</p>
                            <Button variant="outline" onClick={() => router.push(`/owner/properties/${id}/units/create`)} className="border-primary text-primary hover:bg-primary/5">
                                Create First Unit
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
