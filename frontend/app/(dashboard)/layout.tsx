"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LayoutDashboard, Building2, Wallet, FileText, Settings, LogOut, Users, User } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";

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
        <div className="flex min-h-screen relative text-foreground">
            <AnimatedBackground />

            {/* Glass Sidebar */}
            <aside className="w-64 glass-panel m-4 rounded-2xl flex flex-col z-10 h-[calc(100vh-2rem)] sticky top-4">
                <div className="p-6 flex items-center gap-3">
                    <img src="/logo.png" alt="Koko Logo" className="h-10 w-10 object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold text-gradient">
                            Koko
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                            {profile?.role}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {getNavItems().map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className="relative group">
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-primary/10 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start relative z-10 transition-colors ${isActive
                                            ? "text-primary font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                            }`}
                                    >
                                        <item.icon className="mr-3 h-4 w-4" />
                                        {item.name}
                                    </Button>
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <div className="glass-panel p-3 rounded-xl mb-3 flex items-center gap-3 border-none bg-white/5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {profile?.name?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate text-foreground">{profile?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        onClick={logout}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden z-10 relative">

                {/* Header */}
                <header className="h-16 border-b border-white/5 bg-white/5 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-white capitalize">
                            {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Settings className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border border-white/10 ring-2 ring-white/5">
                            {profile?.name?.charAt(0) || "U"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
                    {children}
                </div>

                {/* Footer */}
                <footer className="h-12 border-t border-white/5 bg-black/20 px-8 flex items-center justify-between text-xs text-slate-500">
                    <p>© 2025 Propo Inc. All rights reserved.</p>
                    <div className="flex gap-4">
                        <span className="hover:text-white cursor-pointer">Privacy</span>
                        <span className="hover:text-white cursor-pointer">Terms</span>
                        <span className="hover:text-white cursor-pointer">Support</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
