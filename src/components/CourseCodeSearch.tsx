"use client";

import { useEffect, useState } from "react";

type CourseHit = {
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
  const [courseCode, setCourseCode] = useState("");
  const [results, setResults] = useState<CourseHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const courseTitle = results[0]?.courseTitle;

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = courseCode.trim();
    if (!trimmed) {
      setStatus("Enter a course code.");
      setResults([]);
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/public/course-search?courseCode=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();
      if (!response.ok) {
        setStatus(data?.message || "Search failed.");
        setResults([]);
        return;
      }
      setResults(data);
      if (!data.length) {
        setStatus("No programs found for that course code.");
      }
    } catch (error) {
      setStatus("Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCourseCode("");
    setResults([]);
    setStatus(null);
  }, [resetSignal]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Search by course code</h2>
        <p className="text-sm text-slate-600">
          Enter a course code to see every program cycle that includes it.
        </p>
      </div>

      <form className="flex flex-wrap gap-3" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="e.g. COMP 1151"
          className="w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          value={courseCode}
          onChange={(event) => setCourseCode(event.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      {results.length > 0 && (
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
              {courseCode || "Course"}{" "}
              {courseTitle ? `• ${courseTitle}` : ""}
            </div>
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">Program</th>
                <th className="px-4 py-2">Cycle</th>
                <th className="px-4 py-2">Semester</th>
                <th className="px-4 py-2">Hours/Week</th>
                <th className="px-4 py-2">Total Hours/Sem</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={`${row.programCode}-${row.term}-${row.semester}`}>
                  <td className="border-t px-4 py-2 font-medium text-slate-900">
                    {row.programTitle} ({row.programCode})
                  </td>
                  <td className="border-t px-4 py-2">{row.term}</td>
                  <td className="border-t px-4 py-2">
                    {row.semester ?? "-"}
                  </td>
                  <td className="border-t px-4 py-2">
                    {row.hoursPerWeek ?? "-"}
                  </td>
                  <td className="border-t px-4 py-2">
                    {row.semesterTotalHours ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
