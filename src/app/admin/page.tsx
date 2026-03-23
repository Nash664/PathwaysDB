"use client";

import { useState } from "react";
import Link from "next/link";
import UnifiedCourseSearch from "@/components/UnifiedCourseSearch";

export default function Home() {
  const [resetSignal, setResetSignal] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              College Pathways
            </p>
            <h1 className="text-2xl font-semibold">
              Program &amp; Academic Year Course Finder
            </h1>
          </div>

          <Link
            href="/admin/courses"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Find your courses</h2>
              <p className="mt-2 text-sm text-slate-600">
                Search by program, academic year, semester, and course in one place.
              </p>
            </div>
          </div>

          <UnifiedCourseSearch resetSignal={resetSignal} />
        </div>
      </main>
    </div>
  );
}