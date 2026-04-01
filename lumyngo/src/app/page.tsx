"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Package, Truck, Shield, MapPin, Zap, Star } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Sync user with DB and redirect based on role
    fetch("/api/auth/sync", { method: "POST" })
      .then((r) => r.json())
      .then((dbUser) => {
        if (dbUser.role === "ADMIN") router.push("/admin/dashboard");
        else if (dbUser.role === "RIDER") router.push("/rider/dashboard");
        else router.push("/dashboard");
      })
      .catch(() => router.push("/dashboard"));
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Redirecting you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">LumynGo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          Kenya&apos;s fastest delivery platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Deliver anything,{" "}
          <span className="text-blue-400">anywhere</span> in minutes
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          LumynGo connects customers with trusted riders for fast, reliable
          delivery across Kenya. Track in real-time, pay via M-Pesa.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors"
          >
            Send a Package
          </Link>
          <Link
            href="/sign-up?role=rider"
            className="border border-slate-700 hover:border-slate-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors"
          >
            Become a Rider
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Real-Time Tracking",
              desc: "Watch your rider move on a live map. No more guessing where your package is.",
            },
            {
              icon: Shield,
              title: "Secure Payments",
              desc: "Pay safely via PesaPal — M-Pesa, cards, and more. Every transaction protected.",
            },
            {
              icon: Star,
              title: "Rated Riders",
              desc: "Every rider is rated by customers. Only the best deliver your packages.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Built for everyone
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Package,
              role: "Customer",
              desc: "Create orders, track delivery live, and pay securely.",
              cta: "Start Sending",
              href: "/sign-up",
            },
            {
              icon: Truck,
              role: "Rider",
              desc: "Accept orders, navigate with Google Maps, and earn every delivery.",
              cta: "Ride & Earn",
              href: "/sign-up?role=rider",
            },
            {
              icon: Shield,
              role: "Admin",
              desc: "Full visibility into orders, users, revenue, and system analytics.",
              cta: "Admin Access",
              href: "/sign-in",
            },
          ].map((r) => (
            <div
              key={r.role}
              className="bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <r.icon className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{r.role}</h3>
              <p className="text-slate-400 text-sm mb-6">{r.desc}</p>
              <Link
                href={r.href}
                className="inline-block bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {r.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} LumynGo. All rights reserved.
      </footer>
    </div>
  );
}
