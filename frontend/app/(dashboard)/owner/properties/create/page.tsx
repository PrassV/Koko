"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CreatePropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        description: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/properties/", formData);
            toast.success("Property created successfully");
            router.push("/owner/properties");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to create property");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <Link href="/owner/properties">
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-white">Add New Property</h1>
            </div>

            <GlassCard className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-200">Property Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Sunset Apartments"
                            className="bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-slate-200">Address</Label>
                        <Textarea
                            id="address"
                            placeholder="Full street address..."
                            className="bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 min-h-[80px]"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-slate-200">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the property features..."
                            className="bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Property"}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
