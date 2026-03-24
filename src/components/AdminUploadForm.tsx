"use client";

import { useState } from "react";
import CenteredModal from "@/components/CenteredModal";

const ACCEPTED_EXCEL_EXTENSIONS = [".xlsx", ".xls"];

function isExcelFile(selectedFile: File) {
  const name = selectedFile.name.toLowerCase();
  return ACCEPTED_EXCEL_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export default function AdminUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const openModal = (title: string, message: string) => {
    setModalConfig({ title, message });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("Please choose an Excel file.");
      return;
    }
    if (!isExcelFile(file)) {
      openModal(
        "Wrong file or format",
        "Please upload a valid Excel file in the expected format."
      );
      setStatus("Please choose a valid Excel file (.xlsx or .xls).");
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
        const message = result?.message || "Import failed.";
        const formatIssue =
          response.status === 400 ||
          /missing sheet|missing columns|wrong file or format/i.test(message);
        if (formatIssue) {
          openModal(
            "Wrong file or format",
            "Please upload a valid Excel file in the expected format."
          );
        }
        setStatus(message);
        return;
      }
      setStatus("Import complete.");
      openModal("Import successful", "Excel file imported successfully.");
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
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            if (!selectedFile) {
              setFile(null);
              return;
            }
            if (!isExcelFile(selectedFile)) {
              openModal(
                "Wrong file or format",
                "Please upload a valid Excel file in the expected format."
              );
              setStatus("Please choose a valid Excel file (.xlsx or .xls).");
              event.target.value = "";
              setFile(null);
              return;
            }
            setStatus(null);
            setFile(selectedFile);
          }}
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

      <CenteredModal
        isOpen={modalConfig !== null}
        title={modalConfig?.title ?? "Notice"}
        message={modalConfig?.message ?? ""}
        onConfirm={() => setModalConfig(null)}
      />
    </form>
  );
}
