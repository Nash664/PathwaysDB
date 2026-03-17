"use client";

import { useEffect, useState } from "react";

type Program = {
  code: string;
  title: string;
};

type Course = {
  code: string;
  title: string;
  preRequisite?: string | null;
  coRequisite?: string | null;
  semester?: number | null;
  hoursPerWeek?: number | null;
};

type ProgramCycleSelectorProps = {
  resetSignal?: number;
};

export default function ProgramCycleSelector({
  resetSignal = 0,
}: ProgramCycleSelectorProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cycles, setCycles] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programCode, setProgramCode] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedProgram = programs.find((program) => program.code === programCode);

  useEffect(() => {
    setProgramCode("");
    setTerm("");
    setCourses([]);
    setCycles([]);
  }, [resetSignal]);

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
      setCourses([]);
      return;
    }

    setLoading(true);
    fetch(`/api/public/cycles?programCode=${encodeURIComponent(programCode)}`)
      .then((res) => res.json())
      .then((data: string[]) => {
        setCycles(data);
        setTerm("");
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [programCode]);

  useEffect(() => {
    if (!programCode || !term) {
      setCourses([]);
      return;
    }

    setLoading(true);
    fetch(
      `/api/public/courses?programCode=${encodeURIComponent(
        programCode
      )}&term=${encodeURIComponent(term)}`
    )
      .then((res) => res.json())
      .then((data: Course[]) => setCourses(data))
      .finally(() => setLoading(false));
  }, [programCode, term]);

  return (
    <section className="w-full space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-600">Program</span>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
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

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-600">
            Program Cycle
          </span>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
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
        <p className="text-sm text-slate-500">Loading results...</p>
      )}

      {!loading && term && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Print
            </button>
          </div>
          <div className="print-area overflow-hidden rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {selectedProgram?.title ?? "Program"} ({programCode || "N/A"}) •{" "}
              {term}
            </div>
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">Course Code</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Semester</th>
                <th className="px-4 py-2">Hours/Week</th>
                <th className="px-4 py-2">Pre-Req</th>
                <th className="px-4 py-2">Co-Req</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={`${course.code}-${course.semester}`}>
                  <td className="border-t px-4 py-2 font-medium text-slate-900">
                    {course.code}
                  </td>
                  <td className="border-t px-4 py-2">{course.title}</td>
                  <td className="border-t px-4 py-2">
                    {course.semester ?? "-"}
                  </td>
                  <td className="border-t px-4 py-2">
                    {course.hoursPerWeek ?? "-"}
                  </td>
                  <td className="border-t px-4 py-2">
                    {course.preRequisite ?? "-"}
                  </td>
                  <td className="border-t px-4 py-2">
                    {course.coRequisite ?? "-"}
                  </td>
                </tr>
              ))}
              {!courses.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="border-t px-4 py-6 text-center text-slate-500"
                  >
                    No courses found for this cycle.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
