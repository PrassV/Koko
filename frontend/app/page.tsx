"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, TrendingUp, Clock, HeartHandshake, Building, Users } from "lucide-react";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const stagger = {
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-transparent backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Propo Logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold text-gradient">Koko</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-amber-600 hover:bg-amber-700 text-black font-semibold rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center p-6">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing-hero.png"
            alt="Traditional Tamil Nadu Courtyard"
            className="w-full h-full object-cover scale-105"
          />
        </div>

        <div className="relative z-20 max-w-5xl mx-auto text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl"
          >
            Preserving Heritage,<br />
            <span className="text-gradient">Modernizing Management</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-lg"
          >
            Experience the warmth of traditional hospitality with the efficiency of modern technology.
            Propo simplifies property management for owners and living for tenants.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-black text-lg h-14 px-8 rounded-full shadow-[0_0_30px_-5px_theme(colors.amber.600)] transition-shadow hover:shadow-[0_0_40px_-5px_theme(colors.amber.500)]">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg h-14 px-8 rounded-full backdrop-blur-md bg-white/5">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 px-6 bg-black relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-amber-400 to-yellow-700">
              Why Choose Koko?
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Whether you own a heritage home or are looking for your next sanctuary, we bring value to every interaction.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Owners Column */}
            <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
              <GlassCard className="h-full p-8 border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-900/40">
                    <Building className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">For Owners</h3>
                </div>

                <div className="space-y-6">
                  <FeatureItem
                    icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
                    title="Maximize Yield"
                    desc="Smart pricing algorithms and occupancy tracking to ensure your investment grows."
                  />
                  <FeatureItem
                    icon={<ShieldCheck className="h-5 w-5 text-amber-400" />}
                    title="Verified Tenants"
                    desc="Rigorous background checks to ensure your property is in safe hands."
                  />
                  <FeatureItem
                    icon={<Clock className="h-5 w-5 text-amber-400" />}
                    title="Effortless & Automated"
                    desc="Automated rent collection, reminders, and maintenance tracking."
                  />
                </div>
              </GlassCard>
            </motion.div>

            {/* Tenants Column */}
            <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
              <GlassCard className="h-full p-8 border-sky-500/20 bg-sky-500/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-900/40">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">For Tenants</h3>
                </div>

                <div className="space-y-6">
                  <FeatureItem
                    icon={<HeartHandshake className="h-5 w-5 text-sky-400" />}
                    title="Seamless Living"
                    desc="Pay rent, request repairs, and view agreements all from one app."
                  />
                  <FeatureItem
                    icon={<ShieldCheck className="h-5 w-5 text-sky-400" />}
                    title="No Hidden Fees"
                    desc="Transparent pricing and direct communication with owners."
                  />
                  <FeatureItem
                    icon={<Clock className="h-5 w-5 text-sky-400" />}
                    title="Quick Support"
                    desc="24/7 support for emergency maintenance requests."
                  />
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-black z-0" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to elevate your property experience?</h2>
          <p className="text-lg text-slate-300">Join thousands of owners and tenants trusting Koko in Tamil Nadu and beyond.</p>
          <Link href="/register">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-black text-lg h-16 px-10 rounded-full">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-12 px-6 text-center text-slate-500 text-sm">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
          <img src="/logo.png" alt="Propo" className="h-6 w-6 grayscale" />
          <span className="font-bold">Koko</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Propo Inc. All rights reserved.</p>
      </footer>
    </main>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/5">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-slate-200 mb-1">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
