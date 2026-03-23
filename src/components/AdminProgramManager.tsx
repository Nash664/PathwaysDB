"use client";

import { useEffect, useState } from "react";

type ProgramApi = {
  code: string;
  title: string;
};

type ProgramRow = {
  originalCode: string;
  code: string;
  title: string;
  _key: string; // 👈 add this
};

type AdminProgramManagerProps = {
  onProgramsChanged?: () => void | Promise<void>;
};

export default function AdminProgramManager({
  onProgramsChanged,
}: AdminProgramManagerProps) {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [newProgram, setNewProgram] = useState({
    code: "",
    title: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/admin/programs");
      const data = await response.json();

      if (Array.isArray(data)) {
        const mapped: ProgramRow[] = data.map((program: ProgramApi, index: number) => ({
          originalCode: program.code,
          code: program.code,
          title: program.title,
          _key: program.code + "-" + index, // 👈 stable key
        }));
        setPrograms(mapped);
      } else {
        setPrograms([]);
      }
    } catch {
      setPrograms([]);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreateProgram = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newProgram.code.trim() || !newProgram.title.trim()) {
      const message = "Program code and program title are required.";
      setStatus(message);
      window.alert(message);
      return;
    }

    try {
      setLoadingCreate(true);
      setStatus(null);

      const response = await fetch("/api/admin/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: newProgram.code.trim().toUpperCase(),
          title: newProgram.title.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result?.message || "Failed to create program.";
        setStatus(message);
        window.alert(message);
        return;
      }

      setStatus("Program created successfully.");
      window.alert("Program created successfully.");

      setNewProgram({
        code: "",
        title: "",
      });

      await fetchPrograms();
      await onProgramsChanged?.();
    } catch {
      const message = "Failed to create program.";
      setStatus(message);
      window.alert(message);
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleProgramChange = (
    originalCode: string,
    field: "code" | "title",
    value: string
  ) => {
    setPrograms((prev) =>
      prev.map((program) =>
        program.originalCode === originalCode
          ? {
            ...program,
            [field]: value,
          }
          : program
      )
    );
  };

  const handleSaveProgram = async (program: ProgramRow) => {
    if (!program.code.trim() || !program.title.trim()) {
      const message = "Program code and program title are required.";
      setStatus(message);
      window.alert(message);
      return;
    }

    try {
      setSavingCode(program.originalCode);
      setStatus(null);

      const response = await fetch(
        `/api/admin/programs/${encodeURIComponent(program.originalCode)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: program.code.trim().toUpperCase(),
            title: program.title.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const message = result?.message || "Failed to update program.";
        setStatus(message);
        window.alert(message);
        return;
      }

      setStatus("Program updated successfully.");
      window.alert("Program updated successfully.");

      await fetchPrograms();
      await onProgramsChanged?.();
    } catch {
      const message = "Failed to update program.";
      setStatus(message);
      window.alert(message);
    } finally {
      setSavingCode(null);
    }
  };

  const handleDeleteProgram = async (program: ProgramRow) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this program?"
    );

    if (!confirmed) return;

    try {
      setDeletingCode(program.originalCode);
      setStatus(null);

      const response = await fetch(
        `/api/admin/programs/${encodeURIComponent(program.originalCode)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const message = result?.message || "Failed to delete program.";
        setStatus(message);
        window.alert(message);
        return;
      }

      setStatus("Program deleted successfully.");
      window.alert("Program deleted successfully.");

      await fetchPrograms();
      await onProgramsChanged?.();
    } catch {
      const message = "Failed to delete program.";
      setStatus(message);
      window.alert(message);
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Add a program</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a new program using a program code and program title.
          </p>
        </div>

        <form onSubmit={handleCreateProgram} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Program code</span>
              <input
                type="text"
                value={newProgram.code}
                onChange={(e) =>
                  setNewProgram((prev) => ({ ...prev, code: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Program title</span>
              <input
                type="text"
                value={newProgram.title}
                onChange={(e) =>
                  setNewProgram((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={loadingCreate}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {loadingCreate ? "Creating..." : "Create program"}
            </button>

            {status && <p className="text-sm text-slate-600">{status}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Existing programs</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Update or delete existing programs.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Program Code</th>
                  <th className="px-4 py-3">Program Title</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr key={program._key}>
                    <td className="border-t px-4 py-3">
                      <input
                        type="text"
                        value={program.code}
                        onChange={(e) =>
                          handleProgramChange(
                            program.originalCode,
                            "code",
                            e.target.value
                          )
                        }
                        className="w-36 rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <input
                        type="text"
                        value={program.title}
                        onChange={(e) =>
                          handleProgramChange(
                            program.originalCode,
                            "title",
                            e.target.value
                          )
                        }
                        className="w-full min-w-[280px] rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveProgram(program)}
                          disabled={
                            savingCode === program.originalCode ||
                            deletingCode === program.originalCode
                          }
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {savingCode === program.originalCode ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProgram(program)}
                          disabled={
                            savingCode === program.originalCode ||
                            deletingCode === program.originalCode
                          }
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingCode === program.originalCode ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {programs.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="border-t px-4 py-8 text-center text-slate-500"
                    >
                      No programs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}