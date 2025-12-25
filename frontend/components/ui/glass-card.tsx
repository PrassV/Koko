"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
    hoverEffect?: boolean;
}

export function GlassCard({
    children,
    className,
    gradient = false,
    hoverEffect = true,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            initial={hoverEffect ? { scale: 1, y: 0 } : undefined}
            whileHover={hoverEffect ? { scale: 1.02, y: -5 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md transition-colors",
                gradient && "bg-gradient-to-br from-white/10 to-white/5",
                className
            )}
            {...props}
        >
            {/* Optional internal gradient glow for 'premium' feel */}
            <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
