"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programCode, setProgramCode] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const selectedProgram = programs.find((program) => program.code === programCode);

  useEffect(() => {
    setProgramCode("");
    setTerm("");
    setCourses([]);
    setAcademicYears([]);
    setSearchText("");
    setSemesterFilter("");
  }, [resetSignal]);

  useEffect(() => {
    fetch("/api/public/programs")
      .then((res) => res.json())
      .then((data: Program[]) => setPrograms(data))
      .catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!programCode) {
      setAcademicYears([]);
      setTerm("");
      setCourses([]);
      return;
    }

    setLoading(true);
    fetch(`/api/public/cycles?programCode=${encodeURIComponent(programCode)}`)
      .then((res) => res.json())
      .then((data: string[]) => {
        setAcademicYears(data);
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

  const semesterOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        courses
          .map((course) => course.semester)
          .filter((value): value is number => value !== null && value !== undefined)
      )
    );
    return values.sort((a, b) => a - b);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.code.toLowerCase().includes(query) ||
        course.title.toLowerCase().includes(query) ||
        (course.preRequisite ?? "").toLowerCase().includes(query) ||
        (course.coRequisite ?? "").toLowerCase().includes(query);

      const matchesSemester =
        !semesterFilter || String(course.semester ?? "") === semesterFilter;

      return matchesSearch && matchesSemester;
    });
  }, [courses, searchText, semesterFilter]);

  return (
    <section className="w-full space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-600">Program</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
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
            Academic Year
          </span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            disabled={!academicYears.length}
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

      {term && (
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-600">
              Search within this program
            </span>
            <input
              type="text"
              placeholder="Search by course code, title, pre-req, or co-req"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-600">Semester</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
            >
              <option value="">All semesters</option>
              {semesterOptions.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Loading results...</p>}

      {!loading && term && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
              <span className="font-semibold">{filteredCourses.length}</span> result
              {filteredCourses.length === 1 ? "" : "s"} found
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Print
            </button>
          </div>

          <div className="print-area overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
              {selectedProgram?.title ?? "Program"} ({programCode || "N/A"}) •{" "}
              {term}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Course Code</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Semester</th>
                    <th className="px-4 py-3">Hours/Week</th>
                    <th className="px-4 py-3">Pre-Req</th>
                    <th className="px-4 py-3">Co-Req</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={`${course.code}-${course.semester}`}>
                      <td className="border-t px-4 py-3 font-semibold text-slate-900">
                        {course.code}
                      </td>
                      <td className="border-t px-4 py-3">{course.title}</td>
                      <td className="border-t px-4 py-3">
                        {course.semester ?? "-"}
                      </td>
                      <td className="border-t px-4 py-3">
                        {course.hoursPerWeek ?? "-"}
                      </td>
                      <td className="border-t px-4 py-3">
                        {course.preRequisite ?? "-"}
                      </td>
                      <td className="border-t px-4 py-3">
                        {course.coRequisite ?? "-"}
                      </td>
                    </tr>
                  ))}

                  {!filteredCourses.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-t px-4 py-8 text-center text-slate-500"
                      >
                        No courses matched your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}