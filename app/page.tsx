"use client";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Inputt from "@/components/inputText";
import Features from "@/components/features";
import CtaSection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
      <Navbar />
      <main>
        <Hero />
        <Inputt />
        <Features />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
