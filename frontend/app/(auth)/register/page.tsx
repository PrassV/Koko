"use client";
import { useState, useEffect, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/api"; // backend api
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function RegisterContent() {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    // Mode is "complete_profile" if query param says so OR if user is already logged in (e.g. via Google)
    const isCompleteProfileMode = searchParams.get("mode") === "complete_profile" || !!user;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("TENANT");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setEmail(user.email || "");
            setName(user.displayName || "");
        }
    }, [user]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let token;

            if (isCompleteProfileMode && user) {
                // User already exists in Firebase, just need to register in DB
                token = await user.getIdToken(true);
                // Also update display name if changed
                if (name && name !== user.displayName) {
                    await updateProfile(user, { displayName: name });
                }
            } else {
                // Create in Firebase
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                token = await userCred.user.getIdToken();
                // Set Display Name
                await updateProfile(userCred.user, { displayName: name });
            }

            // Register in Backend
            await api.post("/auth/register", {
                email: (isCompleteProfileMode && user && user.email) ? user.email : email,
                role,
                name
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Account setup complete!");
            await refreshProfile();

            // Redirect based on role
            if (role === "OWNER") router.push("/owner");
            else if (role === "TENANT") router.push("/tenant");
            else router.push("/dashboard");

        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>{isCompleteProfileMode ? "Complete Your Profile" : "Create Account"}</CardTitle>
                <CardDescription>
                    {isCompleteProfileMode ? "Please select your role to continue." : "Get started with Propo."}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    {!isCompleteProfileMode && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                        </>
                    )}

                    {isCompleteProfileMode && (
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="text-sm font-medium text-slate-600 border p-2 rounded bg-slate-100">{email}</div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="role">I am a...</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TENANT">Tenant</SelectItem>
                                <SelectItem value="OWNER">Property Owner</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? "Processing..." : (isCompleteProfileMode ? "Complete Setup" : "Register")}
                    </Button>
                    {!isCompleteProfileMode && (
                        <p className="text-sm text-muted-foreground text-center">
                            Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
                        </p>
                    )}
                </CardFooter>
            </form>
        </Card>
    )
}

export default function RegisterPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Suspense fallback={<div>Loading...</div>}>
                <RegisterContent />
            </Suspense>
        </div>
    );
}
