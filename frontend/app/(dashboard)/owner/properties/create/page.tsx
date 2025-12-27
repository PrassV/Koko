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
    highlights: string[];
    house_rules: string[];
    nearby_places: any[];
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
        amenities: [],
        highlights: [],
        house_rules: [],
        nearby_places: []
    });

    // ... (existing code)

    // --- Render Steps ---
    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-extrabold text-primary"
            >
                It's easy to get started with Koko
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} className="space-y-4 text-lg text-muted-foreground max-w-xl">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-border shadow-sm">
                    <span className="text-2xl font-bold text-primary">1</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-foreground">Tell us about your place</h3>
                        <p className="text-sm text-muted-foreground">Share some basic info, location, and type.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-border shadow-sm">
                    <span className="text-2xl font-bold text-primary">2</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-foreground">Make it stand out</h3>
                        <p className="text-sm text-muted-foreground">Add photos, amenities, and details.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-border shadow-sm">
                    <span className="text-2xl font-bold text-primary">3</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-foreground">Finish up and publish</h3>
                        <p className="text-sm text-muted-foreground">Review your listing and go live.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );

    const renderTypeSelection = () => (
        <div className="max-w-4xl mx-auto w-full">
            <h2 className="text-3xl font-bold text-foreground mb-8">Which of these best describes your place?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PROPERTY_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => updateForm("property_type", type.id)}
                        className={`
                            h-32 flex flex-col items-start justify-between p-4 rounded-xl border-2 transition-all shadow-sm
                            ${formData.property_type === type.id
                                ? "border-primary bg-primary/5 shadow-primary/10"
                                : "border-border bg-white hover:border-primary/30 hover:bg-secondary"
                            }
                        `}
                    >
                        <type.icon className={`h-8 w-8 ${formData.property_type === type.id ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-lg font-medium ${formData.property_type === type.id ? "text-primary" : "text-foreground"}`}>{type.label}</span>
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
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-primary text-sm flex items-center gap-2">
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
            <h2 className="text-3xl font-bold text-foreground mb-8">Share some basics about your place</h2>

            {/* Counter Row */}
            <div className="flex items-center justify-between py-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xl text-foreground font-medium">Number of Units</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full bg-white border-border hover:bg-secondary text-foreground"
                        onClick={() => updateForm("units_count", Math.max(1, formData.units_count - 1))}>-</Button>
                    <span className="text-xl font-bold text-foreground w-8 text-center">{formData.units_count}</span>
                    <Button variant="outline" size="icon" className="rounded-full bg-white border-border hover:bg-secondary text-foreground"
                        onClick={() => updateForm("units_count", formData.units_count + 1)}>+</Button>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xl text-foreground">Total Size (Sq Ft)</Label>
                <div className="relative">
                    <Ruler className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input className="glass-inputs pl-12 text-lg" type="number" placeholder="e.g. 1500" value={formData.size_sqft} onChange={e => updateForm("size_sqft", e.target.value)} />
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xl text-foreground">Completion Date</Label>
                <Input className="glass-inputs text-lg" type="date" value={formData.construction_date} onChange={e => updateForm("construction_date", e.target.value)} />
            </div>

            <div className="space-y-4">
                <Label className="text-xl text-foreground">Description</Label>
                <Textarea className="glass-inputs min-h-[150px] text-lg" placeholder="Describe the vibe of your place..." value={formData.description} onChange={e => updateForm("description", e.target.value)} />
            </div>
        </div>
    );

    const renderAmenities = () => (
        <div className="max-w-3xl mx-auto w-full">
            <h2 className="text-3xl font-bold text-foreground mb-8">What does this place offer?</h2>
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
                                h-24 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all shadow-sm
                                ${isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-white hover:bg-secondary"
                                }
                            `}
                        >
                            <amenity.icon className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{amenity.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderRichDetails = () => {
        const [tempHighlight, setTempHighlight] = useState("");
        const [tempRule, setTempRule] = useState("");
        const [tempNearby, setTempNearby] = useState({ name: "", distance: "" });

        const addHighlight = () => {
            if (tempHighlight.trim()) {
                updateForm("highlights", [...(formData.highlights || []), tempHighlight.trim()]);
                setTempHighlight("");
            }
        };

        const addRule = () => {
            if (tempRule.trim()) {
                updateForm("house_rules", [...(formData.house_rules || []), tempRule.trim()]);
                setTempRule("");
            }
        };

        const addNearby = () => {
            if (tempNearby.name.trim() && tempNearby.distance.trim()) {
                updateForm("nearby_places", [...(formData.nearby_places || []), { ...tempNearby, type: 'place' }]);
                setTempNearby({ name: "", distance: "" });
            }
        };

        return (
            <div className="max-w-3xl mx-auto w-full space-y-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Unique details & House Rules</h2>
                <p className="text-muted-foreground mb-6">Mention what makes your place special and any rules.</p>

                {/* Highlights */}
                <div className="space-y-4">
                    <Label className="text-xl text-foreground">Highlights</Label>
                    <div className="flex gap-2">
                        <Input
                            className="glass-inputs"
                            placeholder="e.g. 'Peaceful', 'City Center', 'Pet Friendly'"
                            value={tempHighlight}
                            onChange={e => setTempHighlight(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addHighlight()}
                        />
                        <Button onClick={addHighlight} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                        {formData.highlights?.map((h: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm flex items-center gap-2">
                                {h} <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => updateForm("highlights", formData.highlights.filter((_, idx) => idx !== i))} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* House Rules */}
                <div className="space-y-4">
                    <Label className="text-xl text-foreground">House Rules</Label>
                    <div className="flex gap-2">
                        <Input
                            className="glass-inputs"
                            placeholder="e.g. 'No Smoking', 'Quiet hours after 10PM'"
                            value={tempRule}
                            onChange={e => setTempRule(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addRule()}
                        />
                        <Button onClick={addRule} className="bg-secondary hover:bg-secondary/80 text-foreground border border-border">Add</Button>
                    </div>
                    <div className="space-y-2">
                        {formData.house_rules?.map((r: string, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-border shadow-sm">
                                <span className="text-foreground">{r}</span>
                                <X className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => updateForm("house_rules", formData.house_rules.filter((_, idx) => idx !== i))} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nearby */}
                <div className="space-y-4">
                    <Label className="text-xl text-foreground">What's Nearby? (Optional)</Label>
                    <div className="flex gap-2">
                        <Input
                            className="glass-inputs flex-1"
                            placeholder="Place Name (e.g. Central Station)"
                            value={tempNearby.name}
                            onChange={e => setTempNearby(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                            className="glass-inputs w-32"
                            placeholder="Dist (5m)"
                            value={tempNearby.distance}
                            onChange={e => setTempNearby(prev => ({ ...prev, distance: e.target.value }))}
                        />
                        <Button onClick={addNearby} className="bg-secondary hover:bg-secondary/80 text-foreground border border-border">Add</Button>
                    </div>
                    <div className="space-y-2">
                        {formData.nearby_places?.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-border shadow-sm">
                                <span className="text-foreground"><strong>{p.name}</strong> • {p.distance}</span>
                                <X className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => updateForm("nearby_places", formData.nearby_places.filter((_, idx) => idx !== i))} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderPhotos = () => (
        <div className="max-w-3xl mx-auto w-full space-y-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Add some photos</h2>
            <p className="text-muted-foreground mb-6">You'll need 5 photos to get started. You can add more or change them later.</p>

            <div
                onClick={() => document.getElementById('photo-upload')?.click()}
                className={`
                    border-2 border-dashed border-border rounded-2xl h-[300px] flex flex-col items-center justify-center
                    cursor-pointer hover:bg-secondary transition-colors group relative overflow-hidden bg-background
                    ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
            >
                <input id="photo-upload" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <div className="p-6 bg-secondary rounded-full mb-4 group-hover:scale-110 transition-transform">
                    {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
                </div>
                <h3 className="text-xl font-semibold text-foreground">Click to upload</h3>
                <p className="text-muted-foreground">or drag and drop here</p>
            </div>

            {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {uploadedPhotos.map((url, i) => (
                        <div key={i} className="aspect-square relative rounded-xl overflow-hidden group border border-border">
                            <img src={url} alt="Property" className="w-full h-full object-cover" />
                            <button
                                onClick={() => setUploadedPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-2 right-2 bg-destructive/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
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
            <h2 className="text-3xl font-bold text-foreground mb-6">Review your listing</h2>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-start gap-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                        {uploadedPhotos[0] ? (
                            <img src={uploadedPhotos[0]} className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Home /></div>}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-foreground">{formData.name || "Untitled Property"}</h3>
                        <p className="text-muted-foreground text-lg">{formData.address_line1}, {formData.city}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                                {formData.property_type || "Type Unset"}
                            </span>
                            <span className="text-muted-foreground">{formData.units_count} Units</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Size</Label>
                        <p className="text-foreground font-medium">{formData.size_sqft || "N/A"} sqft</p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Amenities</Label>
                        <p className="text-foreground font-medium">{formData.amenities.length} Selected</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary/80">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">Your listing will be visible to tenants immediately after publishing.</p>
            </div>
        </div>
    );

    // ... (rest of renders)

    // --- Main Layout ---
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* ... header ... */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <button className="p-2 -ml-2 rounded-full hover:bg-secondary" onClick={() => router.push('/owner/properties')}><X className="h-5 w-5 text-muted-foreground" /></button>
                <div className="text-sm font-medium text-muted-foreground">Step {step} of 7</div>
            </div>

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
                        {step === 5 && renderRichDetails()}
                        {step === 6 && renderPhotos()}
                        {step === 7 && renderReview()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="h-20 border-t border-border/40 bg-background flex items-center justify-between px-8 md:px-12 sticky bottom-0 z-50">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 0 || loading}
                    className="text-muted-foreground hover:bg-secondary hover:text-foreground underline-offset-4"
                >
                    Back
                </Button>

                <div className="flex items-center gap-4">
                    {step === 0 ? (
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg shadow-primary/25"
                            onClick={nextStep}
                        >
                            Get Started
                        </Button>
                    ) : step === 7 ? (
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Publish Listing
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={nextStep}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
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
