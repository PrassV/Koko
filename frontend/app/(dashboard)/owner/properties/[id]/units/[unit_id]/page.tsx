"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, FileText, DollarSign, History, Wrench, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function UnitDetailsPage() {
    const { id, unitId } = useParams(); // property id, unit id
    const router = useRouter();
    const [unit, setUnit] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnit = async () => {
            try {
                // Fetch from our new endpoint
                const res = await api.get(`/properties/units/${unitId}`);
                setUnit(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (unitId) fetchUnit();
    }, [unitId]);

    if (loading) return <div className="p-10 flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-amber-500 rounded-full border-t-transparent"></div></div>;
    if (!unit) return <div className="p-10 text-foreground">Unit not found.</div>;

    const currentTenancy = unit.tenancy;
    const pastTenancies = unit.tenancies?.filter((t: any) => t.id !== currentTenancy?.id) || [];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Property
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-border text-foreground hover:bg-slate-50">
                        <Wrench className="mr-2 h-4 w-4" /> Raise Maintenance
                    </Button>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-md">
                        Edit Unit
                    </Button>
                </div>
            </div>

            {/* Title & Status */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">Unit {unit.unit_number}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${unit.status === 'OCCUPIED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            unit.status === 'VACANT' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                        {unit.status}
                    </span>
                </div>
                <p className="text-muted-foreground">
                    {unit.specifications?.bhk || 2} BHK • {unit.size_sqft} sq ft • {unit.facing} Facing
                </p>
            </div>

            {/* Current Tenant Card */}
            {currentTenancy ? (
                <GlassCard className="p-6 bg-white border-emerald-500/30 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                <User className="h-5 w-5 text-emerald-600" />
                                Current Tenant: {currentTenancy.tenant_name || currentTenancy.tenant?.name || "Unknown"}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Move In: <strong className="text-foreground">{format(new Date(currentTenancy.start_date), 'PPP')}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Lease Ends: <strong className="text-foreground">{currentTenancy.end_date ? format(new Date(currentTenancy.end_date), 'PPP') : 'No Expiry'}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Rent: <strong className="text-foreground">${currentTenancy.rent_amount}/mo</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span>Agreement: {currentTenancy.agreement_url ? <a href={currentTenancy.agreement_url} className="text-amber-600 hover:underline">View PDF</a> : <span className="text-red-400">Not Uploaded</span>}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rent Status (Mock) */}
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center min-w-[150px]">
                            <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                            <span className="text-sm font-bold text-emerald-700">Rent Paid</span>
                            <span className="text-xs text-emerald-600">for {format(new Date(), 'MMMM')}</span>
                        </div>
                    </div>
                </GlassCard>
            ) : (
                <GlassCard className="p-8 text-center bg-slate-50 border-dashed border-slate-300">
                    <h2 className="text-xl font-semibold text-foreground mb-2">This unit is vacant</h2>
                    <p className="text-muted-foreground mb-4">No active tenant found.</p>
                    <Button onClick={() => router.push(`/owner/users/create?unitId=${unitId}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Tenant
                    </Button>
                </GlassCard>
            )}

            {/* History & Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* History */}
                <GlassCard className="bg-white border-border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <History className="h-5 w-5 text-amber-500" /> Tenant History
                    </h3>
                    <div className="space-y-4">
                        {pastTenancies.length > 0 ? (
                            pastTenancies.map((t: any) => (
                                <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                    <div>
                                        <p className="font-medium text-foreground">{t.tenant_name || t.tenant?.name || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(t.start_date), 'MMM yyyy')} - {t.end_date ? format(new Date(t.end_date), 'MMM yyyy') : 'Present'}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-600 font-medium">Past</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No details available.</p>
                        )}
                    </div>
                </GlassCard>

                {/* Specs/Images */}
                <GlassCard className="bg-white border-border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-amber-500" /> Unit Photos
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {unit.images && unit.images.length > 0 ? (
                            unit.images.map((img: string, i: number) => (
                                <img key={i} src={img} alt="Unit" className="w-full h-24 object-cover rounded-lg border border-border" />
                            ))
                        ) : (
                            <div className="col-span-2 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                                No photos uploaded
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

import { Plus, ImageIcon } from "lucide-react";
