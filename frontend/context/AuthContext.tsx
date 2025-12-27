"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api, { setAuthToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
    id: number;
    firebase_uid: string;
    email: string;
    role: "ADMIN" | "OWNER" | "TENANT";
    name: string | null;
    documents: any;
}

interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    logout: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User logged in
                const token = await firebaseUser.getIdToken();
                setAuthToken(token);
                setUser(firebaseUser);

                // Fetch profile
                try {
                    const res = await api.get("/auth/me");
                    setProfile(res.data);
                } catch (error: any) {
                    console.error("Failed to fetch profile", error);
                    if (error.response?.status === 404) {
                        // User exists in Firebase but not in DB -> Needs registration
                        if (!pathname.includes("/register")) {
                            router.push("/register?mode=complete_profile");
                        }
                    } else {
                        // Retry or let UI handle it
                    }
                }
            } else {
                // User logged out
                setAuthToken(null);
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const logout = async () => {
        await auth.signOut();
        router.push("/login");
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const res = await api.get("/auth/me");
            setProfile(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
