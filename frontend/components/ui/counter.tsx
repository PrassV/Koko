"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function Counter({ value }: { value: number }) {
    let spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    let display = useTransform(spring, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
}
