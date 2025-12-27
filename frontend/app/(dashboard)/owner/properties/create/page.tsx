"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { upload } from '@vercel/blob/client';
import { getGeocode, getLatLng } from "use-places-autocomplete";
import { GoogleMap, useLoadScript, Marker, Libraries } from "@react-google-maps/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, MapPin, ArrowRight, Upload, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Load Google Maps Libraries
const libraries: Libraries = ["places"];

export default function CreatePropertyPage() {
    const router = useRouter();
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: libraries,
    });

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        property_type: "",
        units_count: 1,
        location_lat: 0,
        location_lng: 0,
        size_sqft: "",
        facing: "",
        construction_date: "",
        specifications: {},
        // Address specific fields
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        amenities: [] as string[]
    });

    const AMENITIES_LIST = [
        "Watchman", "Gym", "Park", "Swimming Pool", "Lift", "Power Backup",
        "CCTV", "Club House", "Kids Play Area", "Intercom", "Fire Safety",
        "Visitor Parking", "Gas Pipeline", "Rain Water Harvesting"
    ];

    // Map State
    const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 }); // Default Chennai (Tamil Nadu)
    const [mapZoom, setMapZoom] = useState(12);

    // Debounced Geocoding Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            const fullAddress = `${formData.address_line1}, ${formData.city}, ${formData.state}, ${formData.pincode}`;
            if (formData.address_line1 && formData.city) {
                try {
                    const results = await getGeocode({ address: fullAddress });
                    if (results && results[0]) {
                        const { lat, lng } = await getLatLng(results[0]);
                        setMapCenter({ lat, lng });
                        setMapZoom(16);
                        setFormData(prev => ({
                            ...prev,
                            location_lat: lat,
                            location_lng: lng
                        }));
                    }
                } catch (error) {
                    // Silent fail if address not found yet
                    console.log("Geocoding mismatch", error);
                }
            }
        }, 1500); // Wait 1.5s after typing stops

        return () => clearTimeout(timer);
    }, [formData.address_line1, formData.city, formData.state, formData.pincode]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];

        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            setUploadedPhotos(prev => [...prev, newBlob.url]);
            toast.success("Photo uploaded successfully");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload photo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Transform types if needed
            const payload = {
                ...formData,
                // Construct the full address string for the backend
                address: `${formData.address_line1}, ${formData.city}, ${formData.state}, ${formData.pincode}`,
                units_count: Number(formData.units_count),
                size_sqft: Number(formData.size_sqft),
                specifications: {
                    ...formData.specifications,
                    photos: uploadedPhotos
                }
            };

            await api.post("/properties/", payload);
            toast.success("Property created successfully");
            router.push("/owner/properties");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to create property");
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="p-10 text-white">Loading Maps...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header nav */}
            <div className="flex items-center space-x-4">
                <Link href="/owner/properties">
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${step >= 1 ? 'bg-amber-600 border-amber-600 text-black' : 'border-slate-600 text-slate-600'}`}>1</span>
                    <span className="text-slate-600">-</span>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${step >= 2 ? 'bg-yellow-600 border-yellow-600 text-black' : 'border-slate-600 text-slate-600'}`}>2</span>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden w-full flex flex-col md:flex-row h-auto min-h-[800px] shadow-2xl">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col md:flex-row w-full h-full"
                        >
                            {/* Step 1: Form */}
                            <div className="flex-1 p-8 space-y-6 border-r border-white/10 bg-black/20">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Location & Type</h2>
                                    <p className="text-slate-400">Where is your property located?</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-200">Property Name</Label>
                                        <Input
                                            placeholder="e.g. Sunset Apartments"
                                            className="glass-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-200">Address Line 1</Label>
                                            <Input
                                                placeholder="Door No, Street Name"
                                                className="glass-input"
                                                value={formData.address_line1}
                                                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-slate-200">City</Label>
                                                <Input
                                                    placeholder="City"
                                                    className="glass-input"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-200">State</Label>
                                                <Input
                                                    placeholder="State"
                                                    className="glass-input"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-200">Pincode</Label>
                                            <Input
                                                placeholder="600001"
                                                className="glass-input"
                                                value={formData.pincode}
                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-200">Type</Label>
                                            <Select
                                                onValueChange={(val) => setFormData({ ...formData, property_type: val })}
                                                value={formData.property_type}
                                            >
                                                <SelectTrigger className="glass-input">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    <SelectItem value="Apartment">Apartment</SelectItem>
                                                    <SelectItem value="House">Standalone House</SelectItem>
                                                    <SelectItem value="Villa">Villa</SelectItem>
                                                    <SelectItem value="Commercial">Commercial</SelectItem>
                                                    <SelectItem value="Land">Vacant Land</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-200">Units</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                className="glass-input"
                                                value={formData.units_count}
                                                onChange={(e) => setFormData({ ...formData, units_count: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                                        onClick={() => setStep(2)}
                                        disabled={!formData.address_line1 || !formData.city || !formData.name}
                                    >
                                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Step 1: Map */}
                            <div className="flex-1 h-[400px] md:h-auto bg-slate-800 relative">
                                <GoogleMap
                                    zoom={mapZoom}
                                    center={mapCenter}
                                    mapContainerClassName="w-full h-full"
                                    options={{
                                        disableDefaultUI: true,
                                        styles: [
                                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                        ]
                                    }}
                                >
                                    <Marker
                                        position={mapCenter}
                                        animation={google.maps.Animation.DROP}
                                    />
                                </GoogleMap>
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
                                    <p className="text-xs text-slate-400 font-mono">
                                        Lat: {mapCenter.lat.toFixed(4)} <br />
                                        Lng: {mapCenter.lng.toFixed(4)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full min-h-[800px] p-8 flex flex-col overflow-y-auto"
                        >
                            <div className="max-w-2xl mx-auto w-full space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-white">Property Details</h2>
                                    <p className="text-slate-400">Tell us more about the specifications.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-200">Size (Sq Ft)</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 1200"
                                            className="glass-input"
                                            value={formData.size_sqft}
                                            onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-200">Facing</Label>
                                        <Select
                                            onValueChange={(val) => setFormData({ ...formData, facing: val })}
                                            value={formData.facing}
                                        >
                                            <SelectTrigger className="glass-input">
                                                <SelectValue placeholder="Select facing" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                <SelectItem value="North">North</SelectItem>
                                                <SelectItem value="South">South</SelectItem>
                                                <SelectItem value="East">East</SelectItem>
                                                <SelectItem value="West">West</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-200">Construction Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            type="date"
                                            className="glass-input pl-10 block w-full py-2 custom-date-input"
                                            value={formData.construction_date}
                                            onChange={(e) => setFormData({ ...formData, construction_date: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">Approximate completion date.</p>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-slate-200">Amenities</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {AMENITIES_LIST.map((amenity) => (
                                            <button
                                                key={amenity}
                                                onClick={() => {
                                                    const current = formData.amenities || [];
                                                    if (current.includes(amenity)) {
                                                        setFormData({ ...formData, amenities: current.filter(a => a !== amenity) });
                                                    } else {
                                                        setFormData({ ...formData, amenities: [...current, amenity] });
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${(formData.amenities || []).includes(amenity)
                                                    ? 'bg-amber-600 text-black shadow-lg shadow-amber-500/20'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                                    }`}
                                            >
                                                {amenity}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-200">Description</Label>
                                    <Textarea
                                        placeholder="Detailed description of amenities, neighborhood..."
                                        className="glass-input min-h-[120px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-200">Upload Photos</Label>
                                    <div
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className={`border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-white/5 transition-colors cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <input
                                            type="file"
                                            id="photo-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                        <div className="p-4 bg-white/5 rounded-full mb-3 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
                                            {isUploading ? (
                                                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                                            ) : (
                                                <Upload className="h-6 w-6" />
                                            )}
                                        </div>
                                        <p className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}</p>
                                        <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF</p>
                                    </div>

                                    {/* Uploaded Photos Preview */}
                                    {uploadedPhotos.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                            {uploadedPhotos.map((url, i) => (
                                                <div key={i} className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 relative group-hover:opacity-100">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={url} alt="Uploaded" className="h-full w-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 flex justify-between">
                                    <Button
                                        variant="outline"
                                        className="border-white/20 text-white hover:bg-white/10"
                                        onClick={() => setStep(1)}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button
                                        className="bg-yellow-600 hover:bg-yellow-700 min-w-[150px] text-black"
                                        onClick={handleSubmit}
                                        disabled={loading || isUploading}
                                    >
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Property"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>

            <style jsx global>{`
                .glass-input {
                    @apply bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500;
                }
                .custom-date-input::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.5;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
