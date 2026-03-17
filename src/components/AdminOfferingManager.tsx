"use client";

import { useEffect, useState } from "react";

type Program = {
  code: string;
  title: string;
};

type OfferingRow = {
  id: string;
  courseCode: string;
  courseTitle: string;
  semester: number | null;
  hoursPerWeek: number | null;
};

type EditRow = {
  semester: string;
  hoursPerWeek: string;
};

export default function AdminOfferingManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cycles, setCycles] = useState<string[]>([]);
  const [programCode, setProgramCode] = useState("");
  const [term, setTerm] = useState("");
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditRow>>({});

  useEffect(() => {
    fetch("/api/public/programs")
      .then((res) => res.json())
      .then((data: Program[]) => setPrograms(data))
      .catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!programCode) {
      setCycles([]);
      setTerm("");
      setOfferings([]);
      return;
    }

    fetch(`/api/public/cycles?programCode=${encodeURIComponent(programCode)}`)
      .then((res) => res.json())
      .then((data: string[]) => setCycles(data))
      .catch(() => setCycles([]));
  }, [programCode]);

  useEffect(() => {
    if (!programCode || !term) {
      setOfferings([]);
      return;
    }

    setLoading(true);
    fetch(
      `/api/admin/offerings?programCode=${encodeURIComponent(
        programCode
      )}&term=${encodeURIComponent(term)}`
    )
      .then((res) => res.json())
      .then((data: OfferingRow[]) => {
        setOfferings(data);
        const nextEdits: Record<string, EditRow> = {};
        data.forEach((row) => {
          nextEdits[row.id] = {
            semester: row.semester?.toString() ?? "",
            hoursPerWeek: row.hoursPerWeek?.toString() ?? "",
          };
        });
        setEdits(nextEdits);
      })
      .finally(() => setLoading(false));
  }, [programCode, term]);

  const handleEditChange = (
    id: string,
    field: "semester" | "hoursPerWeek",
    value: string
  ) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveRow = async (row: OfferingRow) => {
    setStatus(null);
    const payload = edits[row.id];
    const semesterValue = payload?.semester?.trim();
    const hoursValue = payload?.hoursPerWeek?.trim();
    const semester = semesterValue ? Number(semesterValue) : null;
    const hoursPerWeek = hoursValue ? Number(hoursValue) : null;

    const response = await fetch(`/api/admin/offerings/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semester, hoursPerWeek }),
    });
    if (!response.ok) {
      const data = await response.json();
      setStatus(data?.message || "Update failed.");
      return;
    }
    setStatus("Offering updated.");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Edit semester & hours/week</h2>
      <p className="mt-2 text-sm text-slate-600">
        Choose a program and cycle to edit semester placement and weekly hours.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Program</span>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            value={programCode}
            onChange={(event) => setProgramCode(event.target.value)}
          >
            <option value="">Select a program</option>
            {programs.map((program) => (
              <option key={program.code} value={program.code}>
                {program.title} ({program.code})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Program cycle</span>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            disabled={!cycles.length}
          >
            <option value="">Select a cycle</option>
            {cycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500">Loading offerings...</p>
      )}

      {!loading && offerings.length > 0 && (
        <div className="mt-4 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">Course</th>
                <th className="px-4 py-2">Semester</th>
                <th className="px-4 py-2">Hours/Week</th>
                <th className="px-4 py-2">Save</th>
              </tr>
            </thead>
            <tbody>
              {offerings.map((row) => (
                <tr key={row.id}>
                  <td className="border-t px-4 py-2">
                    <div className="font-medium text-slate-900">
                      {row.courseCode}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.courseTitle}
                    </div>
                  </td>
                  <td className="border-t px-4 py-2">
                    <input
                      type="number"
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm"
                      value={edits[row.id]?.semester ?? ""}
                      onChange={(event) =>
                        handleEditChange(row.id, "semester", event.target.value)
                      }
                    />
                  </td>
                  <td className="border-t px-4 py-2">
                    <input
                      type="number"
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm"
                      value={edits[row.id]?.hoursPerWeek ?? ""}
                      onChange={(event) =>
                        handleEditChange(
                          row.id,
                          "hoursPerWeek",
                          event.target.value
                        )
                      }
                    />
                  </td>
                  <td className="border-t px-4 py-2">
                    <button
                      type="button"
                      onClick={() => saveRow(row)}
                      className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && programCode && term && offerings.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No courses found for this cycle.
        </p>
      )}

      {status && <p className="mt-4 text-sm text-slate-600">{status}</p>}
    </div>
  );
}
