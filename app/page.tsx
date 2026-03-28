"use client";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/navbar";
import Inputt from "@/components/inputText";
import Hero from "@/components/hero";

export default function Home() {
  return (
    <div className=" h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      <Navbar />
      <Hero />
      <Inputt />
    </div>
  );
}
