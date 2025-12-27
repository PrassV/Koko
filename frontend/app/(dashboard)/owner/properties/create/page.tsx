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
                <h2 className="text-3xl font-bold text-white mb-2">Unique details & House Rules</h2>
                <p className="text-slate-400 mb-6">Mention what makes your place special and any rules.</p>

                {/* Highlights */}
                <div className="space-y-4">
                    <Label className="text-xl text-white">Highlights</Label>
                    <div className="flex gap-2">
                        <Input
                            className="glass-inputs"
                            placeholder="e.g. 'Peaceful', 'City Center', 'Pet Friendly'"
                            value={tempHighlight}
                            onChange={e => setTempHighlight(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addHighlight()}
                        />
                        <Button onClick={addHighlight} className="bg-amber-500 hover:bg-amber-600 text-white">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                        {formData.highlights?.map((h: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-sm flex items-center gap-2">
                                {h} <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => updateForm("highlights", formData.highlights.filter((_, idx) => idx !== i))} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* House Rules */}
                <div className="space-y-4">
                    <Label className="text-xl text-white">House Rules</Label>
                    <div className="flex gap-2">
                        <Input
                            className="glass-inputs"
                            placeholder="e.g. 'No Smoking', 'Quiet hours after 10PM'"
                            value={tempRule}
                            onChange={e => setTempRule(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addRule()}
                        />
                        <Button onClick={addRule} className="bg-slate-700 hover:bg-slate-600 text-white">Add</Button>
                    </div>
                    <div className="space-y-2">
                        {formData.house_rules?.map((r: string, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-slate-300">{r}</span>
                                <X className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => updateForm("house_rules", formData.house_rules.filter((_, idx) => idx !== i))} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nearby */}
                <div className="space-y-4">
                    <Label className="text-xl text-white">What's Nearby? (Optional)</Label>
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
                        <Button onClick={addNearby} className="bg-slate-700 hover:bg-slate-600 text-white">Add</Button>
                    </div>
                    <div className="space-y-2">
                        {formData.nearby_places?.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-slate-300"><strong>{p.name}</strong> • {p.distance}</span>
                                <X className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => updateForm("nearby_places", formData.nearby_places.filter((_, idx) => idx !== i))} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ... (rest of renders)

    // --- Main Layout ---
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* ... header ... */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <button className="p-2 -ml-2 rounded-full hover:bg-white/10" onClick={() => router.push('/owner/properties')}><X className="h-5 w-5 text-slate-400" /></button>
                <div className="text-sm font-medium text-slate-400">Step {step} of 7</div>
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
                    ) : step === 7 ? (
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
