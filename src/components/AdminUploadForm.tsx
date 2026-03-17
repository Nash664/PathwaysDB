"use client";

import { useState } from "react";

export default function AdminUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("Please choose an Excel file.");
      return;
    }

    setLoading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        setStatus(result?.message || "Import failed.");
        return;
      }
      setStatus("Import complete.");
    } catch (error) {
      setStatus("Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Upload Excel file
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Importing..." : "Import Data"}
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </form>
  );
}
