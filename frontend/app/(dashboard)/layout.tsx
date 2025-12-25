"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Wallet, FileText, Settings, LogOut, Users, User } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, logout, loading } = useAuth();
    const pathname = usePathname();

    if (loading) return <div className="p-10">Loading...</div>;
    // If not logged in, AuthContext usually redirects, but safety check:
    if (!user) return <div className="p-10">Access Denied. Please Login.</div>;

    const getNavItems = () => {
        // Common items or home
        const items = [];

        if (profile?.role === "OWNER") {
            items.push({ name: "Dashboard", href: "/owner", icon: LayoutDashboard });
            items.push({ name: "Properties", href: "/owner/properties", icon: Building2 });
            items.push({ name: "Finance", href: "/owner/finance", icon: Wallet });
        } else if (profile?.role === "TENANT") {
            items.push({ name: "Dashboard", href: "/tenant", icon: LayoutDashboard });
            items.push({ name: "My Unit", href: "/tenant/unit", icon: Building2 });
            items.push({ name: "Services", href: "/tenant/requests", icon: FileText });
        } else if (profile?.role === "ADMIN") {
            items.push({ name: "Dashboard", href: "/admin", icon: LayoutDashboard });
            items.push({ name: "Users", href: "/admin/users", icon: Users });
        } else {
            items.push({ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
        }
        return items;
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-yellow-500">Propo</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{profile?.role}</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {getNavItems().map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start ${isActive ? "text-gray-900 bg-white" : "text-gray-300 hover:text-white hover:bg-gray-800"}`}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 bg-gray-800 m-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold">
                            {profile?.name?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{profile?.name || "User"}</p>
                            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                        </div>
                    </div>
                    <Button variant="destructive" className="w-full justify-start" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
