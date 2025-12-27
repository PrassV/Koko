"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function CreateUnitPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        unit_number: "",
        size_sqft: "",
        facing: "",
        construction_date: "",
        status: "VACANT",
        specifications: {},
        // Tenant Details (if occupied)
        tenant_name: "",
        tenant_email: "",
        tenant_phone: "",
        rent_amount: "",
        advance_amount: "",
        start_date: "",
        end_date: ""
    });

    const handleSubmit = async () => {
        if (!formData.unit_number) {
            toast.error("Unit number is required");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Unit
            const unitPayload = {
                unit_number: formData.unit_number,
                size_sqft: Number(formData.size_sqft) || 0,
                facing: formData.facing,
                construction_date: formData.construction_date || null,
                status: formData.status,
                specifications: formData.specifications
            };

            const unitRes = await api.post(`/properties/${id}/units`, unitPayload);
            const unitId = unitRes.data.id;

            // 2. If Occupied, Create Tenancy
            if (formData.status === "OCCUPIED") {
                if (!formData.start_date || !formData.rent_amount) {
                    toast.warning("Unit created, but Tenant details incomplete. Please add tenancy manually.");
                } else {
                    const tenancyPayload = {
                        unit_id: unitId,
                        tenant_name: formData.tenant_name,
                        tenant_email: formData.tenant_email,
                        tenant_phone: formData.tenant_phone,
                        rent_amount: Number(formData.rent_amount),
                        advance_amount: Number(formData.advance_amount) || 0,
                        start_date: formData.start_date,
                        end_date: formData.end_date || null
                    };
                    await api.post("/tenancy/", tenancyPayload);
                }
            }

            toast.success("Unit created successfully");
            router.push(`/owner/properties/${id}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to create unit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Property
                </Button>
            </div>

            <GlassCard className="p-8">
                <h1 className="text-2xl font-bold text-white mb-6">Add New Unit</h1>

                <div className="space-y-8">
                    {/* Unit Details */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-amber-400 border-b border-white/10 pb-2">Unit Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-200">Unit Number *</Label>
                                <Input
                                    placeholder="e.g. A-101"
                                    className="glass-input"
                                    value={formData.unit_number}
                                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-200">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger className="glass-input">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="VACANT">Vacant</SelectItem>
                                        <SelectItem value="OCCUPIED">Occupied</SelectItem>
                                        <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                                        <SelectItem value="UNDER_CONSTRUCTION">Under Construction</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-200">Size (Sq Ft)</Label>
                                <Input
                                    type="number"
                                    className="glass-input"
                                    value={formData.size_sqft}
                                    onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-200">Facing</Label>
                                <Select
                                    value={formData.facing}
                                    onValueChange={(val) => setFormData({ ...formData, facing: val })}
                                >
                                    <SelectTrigger className="glass-input">
                                        <SelectValue placeholder="Select..." />
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
                    </div>

                    {/* Tenant Details (Conditional) */}
                    {formData.status === "OCCUPIED" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h2 className="text-lg font-semibold text-emerald-400 border-b border-white/10 pb-2">Tenant & Lease Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Tenant Name *</Label>
                                    <Input
                                        placeholder="Full Name"
                                        className="glass-input"
                                        value={formData.tenant_name}
                                        onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Tenant Email (Optional)</Label>
                                    <Input
                                        placeholder="email@example.com"
                                        className="glass-input"
                                        value={formData.tenant_email}
                                        onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500">If registered, this will link their account.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Rent Amount *</Label>
                                    <Input
                                        type="number"
                                        className="glass-input"
                                        value={formData.rent_amount}
                                        onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Advance / Deposit</Label>
                                    <Input
                                        type="number"
                                        className="glass-input"
                                        value={formData.advance_amount}
                                        onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Lease Start Date *</Label>
                                    <Input
                                        type="date"
                                        className="glass-input custom-date-input"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Lease End Date</Label>
                                    <Input
                                        type="date"
                                        className="glass-input custom-date-input"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6">
                        <Button
                            className="w-full bg-amber-600 hover:bg-amber-700 text-black py-6 text-lg"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Unit</>}
                        </Button>
                    </div>
                </div>
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
