"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { upload } from '@vercel/blob/client';
import { getGeocode, getLatLng } from "use-places-autocomplete";
import { GoogleMap, useLoadScript, Marker, Libraries } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    LayoutDashboard, Home, Building, Castle, Warehouse, Building2,
    MapPin, Ruler, BedDouble, Bath, Armchair,
    Wifi, Car, Dumbbell, Utensils, Trees, Zap, Shield, Search,
    Upload, X, Check, ChevronRight, ChevronLeft, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// --- Configuration & Constants ---
const libraries: Libraries = ["places"];
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const PROPERTY_TYPES = [
    { id: "Apartment", label: "Apartment", icon: Building2 },
    { id: "House", label: "House", icon: Home },
    { id: "Villa", label: "Villa", icon: Castle },
    { id: "Condo", label: "Condo", icon: Building },
    { id: "Commercial", label: "Commercial", icon: Warehouse },
    { id: "Other", label: "Other", icon: LayoutDashboard },
];

const AMENITIES_LIST = [
    { id: "Wifi", label: "Fast Wifi", icon: Wifi },
    { id: "Parking", label: "Parking", icon: Car },
    { id: "Gym", label: "Gym", icon: Dumbbell },
    { id: "Kitchen", label: "Kitchen", icon: Utensils },
    { id: "Garden", label: "Garden", icon: Trees },
    { id: "Power Backup", label: "Power Backup", icon: Zap },
    { id: "Security", label: "24/7 Security", icon: Shield },
    { id: "Pool", label: "Swimming Pool", icon: Armchair }, // Using Armchair as placeholder if Pool not available
];

// --- Types ---
interface FormData {
    name: string;
    description: string;
    property_type: string;
    units_count: number;
    location_lat: number;
    location_lng: number;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    size_sqft: string;
    facing: string;
    construction_date: string;
    specifications: Record<string, any>;
    amenities: string[];
}

export default function CreatePropertyWizard() {
    const router = useRouter();
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: libraries,
    });

    const [step, setStep] = useState(0); // 0: Welcome, 1: Type, 2: Location, 3: Basics, 4: Amenities, 5: Photos, 6: Review
    const [loading, setLoading] = useState(false);

    // Data State
    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        property_type: "",
        units_count: 1,
        location_lat: 0,
        location_lng: 0,
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        size_sqft: "",
        facing: "",
        construction_date: "",
        specifications: {},
        amenities: []
    });

    // Files
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
    const [uploadedDocs, setUploadedDocs] = useState<{ name: string, url: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Map State
    const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 });
    const [mapZoom, setMapZoom] = useState(12);
    const mapRef = useRef<google.maps.Map | null>(null);

    // --- Helpers ---
    const updateForm = (key: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    // --- Geocoding ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            const { address_line1, city, state, pincode } = formData;
            if (step === 2 && address_line1 && city) {
                const fullAddress = `${address_line1}, ${city}, ${state}, ${pincode}`;
                try {
                    const results = await getGeocode({ address: fullAddress });
                    if (results?.[0]) {
                        const { lat, lng } = await getLatLng(results[0]);
                        setMapCenter({ lat, lng });
                        setMapZoom(16);
                        setFormData(prev => ({ ...prev, location_lat: lat, location_lng: lng }));
                        mapRef.current?.panTo({ lat, lng });
                    }
                } catch (e) { console.log(e); }
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [formData.address_line1, formData.city, formData.state, formData.pincode, step]);

    // --- Handlers ---
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const file = e.target.files[0];
        try {
            const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
            setUploadedPhotos(prev => [...prev, blob.url]);
            toast.success("Photo uploaded");
        } catch (err) { toast.error("Upload failed"); }
        finally { setIsUploading(false); }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                address: `${formData.address_line1}, ${formData.city}, ${formData.state}, ${formData.pincode}`,
                units_count: Number(formData.units_count),
                images: uploadedPhotos,
                documents: uploadedDocs
            };
            await api.post("/properties/", payload);
            toast.success("Property created! 🎉");
            router.push("/owner/properties");
        } catch (error: any) {
            toast.error("Failed to create property");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Steps ---
    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-extrabold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent"
            >
                It's easy to get started called Koko
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} className="space-y-4 text-lg text-slate-300 max-w-xl">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-2xl font-bold text-white">1</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-white">Tell us about your place</h3>
                        <p className="text-sm text-slate-400">Share some basic info, location, and type.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-2xl font-bold text-white">2</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-white">Make it stand out</h3>
                        <p className="text-sm text-slate-400">Add photos, amenities, and details.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-2xl font-bold text-white">3</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-white">Finish up and publish</h3>
                        <p className="text-sm text-slate-400">Review your listing and go live.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );

    const renderTypeSelection = () => (
        <div className="max-w-4xl mx-auto w-full">
            <h2 className="text-3xl font-bold text-white mb-8">Which of these best describes your place?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PROPERTY_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => updateForm("property_type", type.id)}
                        className={`
                            h-32 flex flex-col items-start justify-between p-4 rounded-xl border-2 transition-all
                            ${formData.property_type === type.id
                                ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                            }
                        `}
                    >
                        <type.icon className={`h-8 w-8 ${formData.property_type === type.id ? "text-amber-400" : "text-slate-300"}`} />
                        <span className="text-lg font-medium text-white">{type.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderLocation = () => (
        <div className="w-full h-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-4">
                <h2 className="text-3xl font-bold text-foreground mb-4">Where's your place located?</h2>
                <div className="space-y-3">
                    <Input className="glass-inputs" placeholder="Address Line 1" value={formData.address_line1} onChange={e => updateForm("address_line1", e.target.value)} />
                    <div className="flex gap-2">
                        <Input className="glass-inputs" placeholder="City" value={formData.city} onChange={e => updateForm("city", e.target.value)} />
                        <Input className="glass-inputs" placeholder="State" value={formData.state} onChange={e => updateForm("state", e.target.value)} />
                    </div>
                    <Input className="glass-inputs" placeholder="Pincode" value={formData.pincode} onChange={e => updateForm("pincode", e.target.value)} />
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        We'll drop a pin here for tenants.
                    </p>
                </div>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-border relative min-h-[400px] shadow-md">
                {isLoaded && (
                    <GoogleMap
                        zoom={mapZoom}
                        center={mapCenter}
                        mapContainerClassName="w-full h-full"
                        options={{ disableDefaultUI: true }}
                        onLoad={map => { mapRef.current = map; }}
                    >
                        <Marker position={mapCenter} />
                    </GoogleMap>
                )}
            </div>
        </div>
    );

    const renderBasics = () => (
        <div className="max-w-2xl mx-auto w-full space-y-8">
            <h2 className="text-3xl font-bold text-white mb-8">Share some basics about your place</h2>

            {/* Counter Row */}
            <div className="flex items-center justify-between py-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Building2 className="h-6 w-6 text-slate-400" />
                    <span className="text-xl text-white font-medium">Number of Units</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full bg-transparent border-white/20 hover:bg-white/10 text-white"
                        onClick={() => updateForm("units_count", Math.max(1, formData.units_count - 1))}>-</Button>
                    <span className="text-xl font-bold text-white w-8 text-center">{formData.units_count}</span>
                    <Button variant="outline" size="icon" className="rounded-full bg-transparent border-white/20 hover:bg-white/10 text-white"
                        onClick={() => updateForm("units_count", formData.units_count + 1)}>+</Button>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xl text-white">Total Size (Sq Ft)</Label>
                <div className="relative">
                    <Ruler className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <Input className="glass-inputs pl-12 text-lg" type="number" placeholder="e.g. 1500" value={formData.size_sqft} onChange={e => updateForm("size_sqft", e.target.value)} />
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xl text-white">Completion Date</Label>
                <Input className="glass-inputs text-lg" type="date" value={formData.construction_date} onChange={e => updateForm("construction_date", e.target.value)} />
            </div>

            <div className="space-y-4">
                <Label className="text-xl text-white">Description</Label>
                <Textarea className="glass-inputs min-h-[150px] text-lg" placeholder="Describe the vibe of your place..." value={formData.description} onChange={e => updateForm("description", e.target.value)} />
            </div>
        </div>
    );

    const renderAmenities = () => (
        <div className="max-w-3xl mx-auto w-full">
            <h2 className="text-3xl font-bold text-white mb-8">What does this place offer?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES_LIST.map(amenity => {
                    const isSelected = formData.amenities.includes(amenity.id);
                    return (
                        <button
                            key={amenity.id}
                            onClick={() => {
                                const newAmenities = isSelected
                                    ? formData.amenities.filter(a => a !== amenity.id)
                                    : [...formData.amenities, amenity.id];
                                updateForm("amenities", newAmenities);
                            }}
                            className={`
                                h-24 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                                ${isSelected
                                    ? "border-amber-500 bg-amber-500/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/10"
                                }
                            `}
                        >
                            <amenity.icon className={`h-8 w-8 ${isSelected ? "text-amber-400" : "text-slate-300"}`} />
                            <span className={`font-medium ${isSelected ? "text-white" : "text-slate-400"}`}>{amenity.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderPhotos = () => (
        <div className="max-w-3xl mx-auto w-full space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">Add some photos</h2>
            <p className="text-slate-400 mb-6">You'll need 5 photos to get started. You can add more or change them later.</p>

            <div
                onClick={() => document.getElementById('photo-upload')?.click()}
                className={`
                    border-2 border-dashed border-white/20 rounded-2xl h-[300px] flex flex-col items-center justify-center 
                    cursor-pointer hover:bg-white/5 transition-colors group relative overflow-hidden
                    ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
            >
                <input id="photo-upload" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <div className="p-6 bg-slate-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-amber-500" /> : <Upload className="h-8 w-8 text-white" />}
                </div>
                <h3 className="text-xl font-semibold text-white">Click to upload</h3>
                <p className="text-slate-400">or drag and drop here</p>
            </div>

            {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {uploadedPhotos.map((url, i) => (
                        <div key={i} className="aspect-square relative rounded-xl overflow-hidden group">
                            <img src={url} alt="Property" className="w-full h-full object-cover" />
                            <button
                                onClick={() => setUploadedPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReview = () => (
        <div className="max-w-2xl mx-auto w-full space-y-8">
            <h2 className="text-3xl font-bold text-white mb-6">Review your listing</h2>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-start gap-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        {uploadedPhotos[0] ? (
                            <img src={uploadedPhotos[0]} className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-slate-500"><Home /></div>}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">{formData.name || "Untitled Property"}</h3>
                        <p className="text-slate-400 text-lg">{formData.address_line1}, {formData.city}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
                                {formData.property_type || "Type Unset"}
                            </span>
                            <span className="text-slate-400">{formData.units_count} Units</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Size</Label>
                        <p className="text-white font-medium">{formData.size_sqft || "N/A"} sqft</p>
                    </div>
                    <div>
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Amenities</Label>
                        <p className="text-white font-medium">{formData.amenities.length} Selected</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">Your listing will be visible to tenants immediately after publishing.</p>
            </div>
        </div>
    );

    // --- Main Layout ---
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Top Bar for Progress */}
            {step > 0 && (
                <div className="h-16 px-8 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                    <button className="p-2 -ml-2 rounded-full hover:bg-white/10" onClick={() => router.push('/owner/properties')}><X className="h-5 w-5 text-slate-400" /></button>
                    <div className="text-sm font-medium text-slate-400">Step {step} of 6</div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="flex-1 p-8 md:p-12 overflow-y-auto flex items-center justify-center"
                    >
                        {step === 0 && renderWelcome()}
                        {step === 1 && renderTypeSelection()}
                        {step === 2 && renderLocation()}
                        {step === 3 && renderBasics()}
                        {step === 4 && renderAmenities()}
                        {step === 5 && renderPhotos()}
                        {step === 6 && renderReview()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="h-20 border-t border-white/10 bg-black flex items-center justify-between px-8 md:px-12 sticky bottom-0 z-50">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 0 || loading}
                    className="text-white hover:bg-white/10 hover:text-white underline-offset-4"
                >
                    Back
                </Button>

                <div className="flex items-center gap-4">
                    {step === 0 ? (
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8 shadow-lg shadow-amber-500/25"
                            onClick={nextStep}
                        >
                            Get Started
                        </Button>
                    ) : step === 6 ? (
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-white text-black hover:bg-slate-200 font-bold px-8"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Publish Listing
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={nextStep}
                            className="bg-white text-black hover:bg-slate-200 font-bold px-8"
                        >
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .glass-inputs {
                    @apply bg-white border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20 h-12 rounded-xl transition-all shadow-sm;
                }
            `}</style>
        </div>
    );
}
