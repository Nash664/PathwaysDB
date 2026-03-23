"use client";

import AdminProgramManager from "@/components/AdminProgramManager";

export default function AdminProgramsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <AdminProgramManager />
      </main>
    </div>
  );
}