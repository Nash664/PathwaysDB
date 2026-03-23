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
  preRequisite?: string | null;
  semester: number | null;
  hoursPerWeek: number | null;
};

export default function AdminCourseManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);

  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

  const [newCourse, setNewCourse] = useState({
    code: "",
    title: "",
    preRequisite: "",
    programCode: "",
    academicYear: "",
    semester: "",
    hoursPerWeek: "",
  });

  const [status, setStatus] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/programs")
      .then((res) => res.json())
      .then((data) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));

    fetch("/api/public/academic-years")
      .then((res) => res.json())
      .then((data) => setAcademicYears(Array.isArray(data) ? data : []))
      .catch(() => setAcademicYears([]));
  }, []);

  useEffect(() => {
    if (!selectedProgram || !selectedAcademicYear) {
      setOfferings([]);
      return;
    }

    fetchOfferings(selectedProgram, selectedAcademicYear);
  }, [selectedProgram, selectedAcademicYear]);

  const fetchOfferings = async (programCode: string, academicYear: string) => {
    try {
      setLoadingOfferings(true);

      const response = await fetch(
        `/api/admin/offerings?programCode=${encodeURIComponent(
          programCode
        )}&term=${encodeURIComponent(academicYear)}`
      );

      const data = await response.json();
      setOfferings(Array.isArray(data) ? data : []);
    } catch {
      setOfferings([]);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !newCourse.code.trim() ||
      !newCourse.title.trim() ||
      !newCourse.programCode ||
      !newCourse.academicYear
    ) {
      setStatus(
        "Course code, course title, program, and academic year are required."
      );
      window.alert(
        "Course code, course title, program, and academic year are required."
      );
      return;
    }

    try {
      setLoadingCreate(true);
      setStatus(null);

      const createdProgramCode = newCourse.programCode;
      const createdAcademicYear = newCourse.academicYear;

      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: newCourse.code.trim(),
          title: newCourse.title.trim(),
          preRequisite: newCourse.preRequisite.trim() || null,
          programCode: newCourse.programCode,
          academicYear: newCourse.academicYear,
          semester: newCourse.semester ? Number(newCourse.semester) : null,
          hoursPerWeek: newCourse.hoursPerWeek
            ? Number(newCourse.hoursPerWeek)
            : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result?.message || "Failed to create course.";
        setStatus(message);
        window.alert(message);
        return;
      }

      setStatus("Course created and added successfully.");
      window.alert("Course created and added successfully.");

      setNewCourse({
        code: "",
        title: "",
        preRequisite: "",
        programCode: "",
        academicYear: "",
        semester: "",
        hoursPerWeek: "",
      });

      setSelectedProgram(createdProgramCode);
      setSelectedAcademicYear(createdAcademicYear);
      await fetchOfferings(createdProgramCode, createdAcademicYear);
    } catch {
      setStatus("Failed to create course.");
      window.alert("Failed to create course.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleOfferingChange = (
    id: string,
    field:
      | "courseCode"
      | "courseTitle"
      | "preRequisite"
      | "semester"
      | "hoursPerWeek",
    value: string
  ) => {
    setOfferings((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === "semester" || field === "hoursPerWeek"
                  ? value === ""
                    ? null
                    : Number(value)
                  : value,
            }
          : row
      )
    );
  };

  const handleSaveOffering = async (row: OfferingRow) => {
    try {
      setSavingRowId(row.id);
      setStatus(null);

      const response = await fetch(`/api/admin/offerings/${row.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseCode: row.courseCode.trim(),
          title: row.courseTitle.trim(),
          preRequisite: row.preRequisite?.trim() || null,
          semester: row.semester,
          hoursPerWeek: row.hoursPerWeek,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result?.message || "Failed to save changes.";
        setStatus(message);
        window.alert(message);
        return;
      }

      setStatus("Course updated successfully.");
      window.alert("Course updated successfully.");

      if (selectedProgram && selectedAcademicYear) {
        await fetchOfferings(selectedProgram, selectedAcademicYear);
      }
    } catch {
      setStatus("Failed to save changes.");
      window.alert("Failed to save changes.");
    } finally {
      setSavingRowId(null);
    }
  };

  const handleDeleteOffering = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course from this academic year?"
    );

    if (!confirmed) return;

    try {
      setSavingRowId(id);
      setStatus(null);

      const response = await fetch(`/api/admin/offerings/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result?.message || "Failed to delete course.";
        setStatus(message);
        window.alert(message);
        return;
      }

      setStatus("Course deleted successfully.");
      window.alert("Course deleted successfully.");

      if (selectedProgram && selectedAcademicYear) {
        await fetchOfferings(selectedProgram, selectedAcademicYear);
      }
    } catch {
      setStatus("Failed to delete course.");
      window.alert("Failed to delete course.");
    } finally {
      setSavingRowId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Add a course</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Add a course and place it directly into a program and academic year.
          </p>
        </div>

        <form onSubmit={handleCreateCourse} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Course code
              </span>
              <input
                type="text"
                value={newCourse.code}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, code: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Course title
              </span>
              <input
                type="text"
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Pre-requisite
              </span>
              <input
                type="text"
                value={newCourse.preRequisite}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    preRequisite: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Program</span>
              <select
                value={newCourse.programCode}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    programCode: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.code} value={program.code}>
                    {program.title} ({program.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Academic year
              </span>
              <select
                value={newCourse.academicYear}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              >
                <option value="">Select an academic year</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Semester</span>
              <input
                type="number"
                min="1"
                value={newCourse.semester}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    semester: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Weekly hours
              </span>
              <input
                type="number"
                min="0"
                value={newCourse.hoursPerWeek}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    hoursPerWeek: e.target.value,
                  }))
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
              {loadingCreate ? "Creating..." : "Create course"}
            </button>

            {status && <p className="text-sm text-slate-600">{status}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Edit courses in an academic year
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Change course code, course title, pre-requisite, semester, and weekly
            hours for the selected program and academic year.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Program</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
            >
              <option value="">Select a program</option>
              {programs.map((program) => (
                <option key={program.code} value={program.code}>
                  {program.title} ({program.code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Academic year
            </span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
            >
              <option value="">Select an academic year</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {loadingOfferings
              ? "Loading course offerings..."
              : selectedProgram && selectedAcademicYear
              ? `${offerings.length} course offering${
                  offerings.length === 1 ? "" : "s"
                }`
              : "Select a program and academic year to view offerings"}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3">Pre-requisite</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Weekly Hours</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((row) => (
                  <tr key={row.id}>
                    <td className="border-t px-4 py-3">
                      <input
                        type="text"
                        value={row.courseCode}
                        onChange={(e) =>
                          handleOfferingChange(row.id, "courseCode", e.target.value)
                        }
                        className="w-32 rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <input
                        type="text"
                        value={row.courseTitle}
                        onChange={(e) =>
                          handleOfferingChange(row.id, "courseTitle", e.target.value)
                        }
                        className="w-full min-w-[220px] rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <input
                        type="text"
                        value={row.preRequisite ?? ""}
                        onChange={(e) =>
                          handleOfferingChange(row.id, "preRequisite", e.target.value)
                        }
                        className="w-full min-w-[180px] rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <input
                        type="number"
                        value={row.semester ?? ""}
                        onChange={(e) =>
                          handleOfferingChange(row.id, "semester", e.target.value)
                        }
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <input
                        type="number"
                        value={row.hoursPerWeek ?? ""}
                        onChange={(e) =>
                          handleOfferingChange(
                            row.id,
                            "hoursPerWeek",
                            e.target.value
                          )
                        }
                        className="w-28 rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </td>

                    <td className="border-t px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveOffering(row)}
                          disabled={savingRowId === row.id}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {savingRowId === row.id ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOffering(row.id)}
                          disabled={savingRowId === row.id}
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loadingOfferings &&
                  selectedProgram &&
                  selectedAcademicYear &&
                  offerings.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-t px-4 py-8 text-center text-slate-500"
                      >
                        No course offerings found for this academic year.
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