"use client";

import { useState } from "react";
import Link from "next/link";
import CourseCodeSearch from "@/components/CourseCodeSearch";
import ProgramCycleSelector from "@/components/ProgramCycleSelector";

export default function Home() {
  const [resetSignal, setResetSignal] = useState(0);
  const [activeTab, setActiveTab] = useState<"program" | "course">("program");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              College Pathways
            </p>
            <h1 className="text-2xl font-semibold">
              Program &amp; Cycle Course Finder
            </h1>
          </div>
          <Link
            href="/admin"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Find your courses</h2>
          <p className="text-sm text-slate-600">
            Select a program and a cycle (for example 2024-2025) to view the
            courses in that plan.
          </p>
          <button
            type="button"
            onClick={() => setResetSignal((prev) => prev + 1)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Clear all
          </button>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("program")}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
              activeTab === "program"
                ? "bg-slate-900 text-white"
                : "border border-slate-400 bg-white text-slate-900 hover:border-slate-500"
            }`}
          >
            Search your courses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("course")}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
              activeTab === "course"
                ? "bg-slate-900 text-white"
                : "border border-slate-400 bg-white text-slate-900 hover:border-slate-500"
            }`}
          >
            Find by course ID
          </button>
        </div>

        {activeTab === "program" ? (
          <ProgramCycleSelector resetSignal={resetSignal} />
        ) : (
          <CourseCodeSearch resetSignal={resetSignal} />
        )}
      </main>
    </div>
  );
}
