"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#0f172a]">
            {/* Deep Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />

            {/* Floating Blobs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute -top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[100px]"
            />

            <motion.div
                animate={{
                    x: [0, -100, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2,
                }}
                className="absolute top-1/2 right-0 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[120px]"
            />

            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 50, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 5,
                }}
                className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[90px]"
            />
        </div>
    );
}
