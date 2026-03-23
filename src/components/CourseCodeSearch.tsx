"use client";

import { useEffect, useMemo, useState } from "react";

type CourseHit = {
  courseCode?: string;
  courseTitle: string;
  programCode: string;
  programTitle: string;
  term: string;
  semester: number | null;
  hoursPerWeek: number | null;
  semesterTotalHours: number | null;
};

type CourseCodeSearchProps = {
  resetSignal?: number;
};

export default function CourseCodeSearch({
  resetSignal = 0,
}: CourseCodeSearchProps) {
  const [query, setQuery] = useState("");
  const [programQuery, setProgramQuery] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [results, setResults] = useState<CourseHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const titleSummary = useMemo(() => {
    const first = results[0];
    if (!first) return "";
    return first.courseTitle;
  }, [results]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    const trimmedProgram = programQuery.trim();

    if (!trimmedQuery && !trimmedProgram && !academicYear && !semester) {
      setStatus("Enter at least one search filter.");
      setResults([]);
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const params = new URLSearchParams();
      if (trimmedQuery) params.set("query", trimmedQuery);
      if (trimmedProgram) params.set("program", trimmedProgram);
      if (academicYear) params.set("term", academicYear);
      if (semester) params.set("semester", semester);

      const response = await fetch(`/api/public/course-search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus(data?.message || "Search failed.");
        setResults([]);
        return;
      }

      setResults(data);

      if (!data.length) {
        setStatus("No matching courses found.");
      }
    } catch {
      setStatus("Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery("");
    setProgramQuery("");
    setAcademicYear("");
    setSemester("");
    setResults([]);
    setStatus(null);
  }, [resetSignal]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Search courses</h2>
        <p className="text-sm text-slate-600">
          Search by course code, course title, program, academic year, or semester.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Course code or title (e.g. COMP 1151 or Programming)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <input
            type="text"
            placeholder="Program code or title (optional)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
            value={programQuery}
            onChange={(event) => setProgramQuery(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Academic year (e.g. 2024-2025)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
          />

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-slate-400"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
          >
            <option value="">All semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
              <span className="font-semibold">{results.length}</span> result
              {results.length === 1 ? "" : "s"} found
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
              {query || "Course Search"} {titleSummary ? `• ${titleSummary}` : ""}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Academic Year</th>
                    <th className="px-4 py-3">Semester</th>
                    <th className="px-4 py-3">Hours/Week</th>
                    <th className="px-4 py-3">Total Hours/Sem</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => (
                    <tr
                      key={`${row.programCode}-${row.term}-${row.semester}-${index}`}
                    >
                      <td className="border-t px-4 py-3 font-medium text-slate-900">
                        {row.programTitle} ({row.programCode})
                      </td>
                      <td className="border-t px-4 py-3">{row.term}</td>
                      <td className="border-t px-4 py-3">{row.semester ?? "-"}</td>
                      <td className="border-t px-4 py-3">
                        {row.hoursPerWeek ?? "-"}
                      </td>
                      <td className="border-t px-4 py-3">
                        {row.semesterTotalHours ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}