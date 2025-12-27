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
        <div className="flex min-h-screen relative bg-background text-foreground">
            <AnimatedBackground />

            {/* Glass Sidebar */}
            <aside className="w-64 glass-panel m-4 rounded-2xl flex flex-col z-10 h-[calc(100vh-2rem)] sticky top-4 bg-white/50 backdrop-blur-xl border-white/20 shadow-xl">
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
                                            : "text-muted-foreground hover:text-foreground hover:bg-black/5"
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
                    <div className="glass-panel p-3 rounded-xl mb-3 flex items-center gap-3 border-none bg-white/40 shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {profile?.name?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate text-foreground">{profile?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50"
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
                <header className="h-16 border-b border-border/40 bg-white/30 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-foreground capitalize">
                            {(() => {
                                const segments = pathname.split('/');
                                const last = segments.pop();
                                if (last && !isNaN(Number(last))) {
                                    const prev = segments.pop();
                                    // If strictly numeric, try to provide context
                                    return prev ? `${prev.replace(/-/g, ' ')} Details` : 'Details';
                                }
                                return last?.replace(/-/g, ' ') || 'Dashboard';
                            })()}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-black/5">
                            <Settings className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold border border-white/20 ring-2 ring-amber-100 shadow-md">
                            {profile?.name?.charAt(0) || "U"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
                    {children}
                </div>

                {/* Footer */}
                <footer className="h-12 border-t border-border/40 bg-white/20 px-8 flex items-center justify-between text-xs text-muted-foreground">
                    <p>© 2025 Propo Inc. All rights reserved.</p>
                    <div className="flex gap-4">
                        <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
                        <span className="hover:text-primary cursor-pointer transition-colors">Support</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
