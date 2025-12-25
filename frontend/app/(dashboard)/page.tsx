"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile) {
            if (profile.role === "OWNER") router.push("/owner");
            else if (profile.role === "TENANT") router.push("/tenant");
            else if (profile.role === "ADMIN") router.push("/admin");
        }
    }, [loading, profile, router]);

    return (
        <div className="flex items-center justify-center p-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );
}
