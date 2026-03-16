"use client";

import { useEffect, useMemo, useState } from "react";

type Program = {
  code: string;
  title: string;
};

type OfferingRow = {
  id: string;
  courseCode: string;
  courseTitle: string;
  preRequisite: string | null;
  coRequisite: string | null;
  semester: number | null;
  hoursPerWeek: number | null;
};

type EditRow = {
  courseCode: string;
  courseTitle: string;
  preRequisite: string;
  coRequisite: string;
  semester: string;
  hoursPerWeek: string;
};

type DraftCourse = {
  code: string;
  title: string;
  preRequisite: string;
  coRequisite: string;
};

const emptyDraft: DraftCourse = {
  code: "",
  title: "",
  preRequisite: "",
  coRequisite: "",
};

export default function AdminCourseManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cycles, setCycles] = useState<string[]>([]);
  const [programCode, setProgramCode] = useState("");
  const [term, setTerm] = useState("");
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [edits, setEdits] = useState<Record<string, EditRow>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftCourse>(emptyDraft);
  const [creating, setCreating] = useState(false);

  const sortedOfferings = useMemo(
    () =>
      [...offerings].sort((a, b) =>
        a.courseCode.localeCompare(b.courseCode)
      ),
    [offerings]
  );

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
    setStatus(null);
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
            courseCode: row.courseCode,
            courseTitle: row.courseTitle,
            preRequisite: row.preRequisite ?? "",
            coRequisite: row.coRequisite ?? "",
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
    field: keyof EditRow,
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

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setCreating(true);
    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: draft.code,
        title: draft.title,
        preRequisite: draft.preRequisite,
        coRequisite: draft.coRequisite,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data?.message || "Create failed.");
      setCreating(false);
      return;
    }
    setDraft(emptyDraft);
    setCreating(false);
    setStatus("Course created.");
  };

  const saveRow = async (row: OfferingRow) => {
    const edit = edits[row.id];
    if (!edit) {
      return;
    }

    const parseJson = async (response: Response) => {
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return null;
      }
      try {
        return await response.json();
      } catch {
        return null;
      }
    };

    setStatus(null);
    const semester = edit.semester.trim() ? Number(edit.semester) : null;
    const hoursPerWeek = edit.hoursPerWeek.trim()
      ? Number(edit.hoursPerWeek)
      : null;

    const courseResponse = await fetch(
      `/api/admin/courses/${encodeURIComponent(row.courseCode)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edit.courseTitle,
          preRequisite: edit.preRequisite,
          coRequisite: edit.coRequisite,
          newCode:
            edit.courseCode.trim() !== row.courseCode
              ? edit.courseCode.trim()
              : undefined,
        }),
      }
    );
    const courseData = await parseJson(courseResponse);
    if (!courseResponse.ok) {
      setStatus(courseData?.message || "Course update failed.");
      return;
    }

    const offeringResponse = await fetch(`/api/admin/offerings/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semester, hoursPerWeek }),
    });
    const offeringData = await parseJson(offeringResponse);
    if (!offeringResponse.ok) {
      setStatus(offeringData?.message || "Offering update failed.");
      return;
    }

    setOfferings((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? {
              ...item,
              courseCode: courseData?.code ?? edit.courseCode,
              courseTitle: courseData?.title ?? edit.courseTitle,
              preRequisite: courseData?.preRequisite ?? edit.preRequisite,
              coRequisite: courseData?.coRequisite ?? edit.coRequisite,
              semester: offeringData?.semester ?? semester,
              hoursPerWeek: offeringData?.hoursPerWeek ?? hoursPerWeek,
            }
          : item
      )
    );
    setStatus("Course updated.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add a course</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Course code</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              value={draft.code}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, code: event.target.value }))
              }
              required
            />
          </label>
          <label className="space-y-2 text-sm md:col-span-1">
            <span className="font-medium text-slate-700">Title</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              value={draft.title}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Pre-requisite</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              value={draft.preRequisite}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  preRequisite: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Co-requisite</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              value={draft.coRequisite}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  coRequisite: event.target.value,
                }))
              }
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {creating ? "Saving..." : "Create course"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Edit courses in a cycle</h2>
        <p className="mt-2 text-sm text-slate-600">
          Select a program and cycle to update course info, semester, and
          hours/week together.
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
          <p className="mt-4 text-sm text-slate-500">Loading courses...</p>
        )}

        {!loading && sortedOfferings.length > 0 && (
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2">Course code</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Pre-Req</th>
                  <th className="px-4 py-2">Co-Req</th>
                  <th className="px-4 py-2">Semester</th>
                  <th className="px-4 py-2">Hours/Week</th>
                  <th className="px-4 py-2">Save</th>
                </tr>
              </thead>
              <tbody>
                {sortedOfferings.map((row) => (
                  <tr key={row.id}>
                    <td className="border-t px-4 py-2">
                      <input
                        className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm"
                        value={edits[row.id]?.courseCode ?? ""}
                        onChange={(event) =>
                          handleEditChange(
                            row.id,
                            "courseCode",
                            event.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border-t px-4 py-2">
                      <input
                        className="w-56 rounded-md border border-slate-200 px-2 py-1 text-sm"
                        value={edits[row.id]?.courseTitle ?? ""}
                        onChange={(event) =>
                          handleEditChange(
                            row.id,
                            "courseTitle",
                            event.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border-t px-4 py-2">
                      <input
                        className="w-36 rounded-md border border-slate-200 px-2 py-1 text-sm"
                        value={edits[row.id]?.preRequisite ?? ""}
                        onChange={(event) =>
                          handleEditChange(
                            row.id,
                            "preRequisite",
                            event.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border-t px-4 py-2">
                      <input
                        className="w-36 rounded-md border border-slate-200 px-2 py-1 text-sm"
                        value={edits[row.id]?.coRequisite ?? ""}
                        onChange={(event) =>
                          handleEditChange(
                            row.id,
                            "coRequisite",
                            event.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border-t px-4 py-2">
                      <input
                        type="number"
                        className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                        value={edits[row.id]?.semester ?? ""}
                        onChange={(event) =>
                          handleEditChange(
                            row.id,
                            "semester",
                            event.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border-t px-4 py-2">
                      <input
                        type="number"
                        className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
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
                        className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
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

        {!loading && programCode && term && sortedOfferings.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            No courses found for this cycle.
          </p>
        )}
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}
    </div>
  );
}
