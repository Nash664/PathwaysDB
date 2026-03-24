"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Program = {
  code: string;
  title: string;
};

type CourseOption = {
  code: string;
  title: string;
};

type SearchResult = {
  programCode: string;
  programTitle: string;
  academicYear: string;
  semester: number | null;
  courseCode: string;
  courseTitle: string;
  hoursPerWeek: number | null;
  semesterTotalHours: number | null;
};

type UnifiedCourseSearchProps = {
  resetSignal?: number;
};

function isCourseOption(value: unknown): value is CourseOption {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && typeof item.title === "string";
}

function normalizeCourseOptions(data: unknown): CourseOption[] {
  if (!Array.isArray(data)) return [];

  const normalized: CourseOption[] = [];

  for (const item of data) {
    if (isCourseOption(item)) {
      normalized.push(item);
      continue;
    }

    if (
      item &&
      typeof item === "object" &&
      "course" in item &&
      item.course &&
      typeof item.course === "object"
    ) {
      const nested = item.course as Record<string, unknown>;
      if (typeof nested.code === "string" && typeof nested.title === "string") {
        normalized.push({
          code: nested.code,
          title: nested.title,
        });
      }
    }
  }

  const unique = new Map<string, CourseOption>();
  for (const item of normalized) {
    unique.set(item.code, item);
  }

  return Array.from(unique.values());
}

export default function UnifiedCourseSearch({
  resetSignal = 0,
}: UnifiedCourseSearchProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);

  const [programCode, setProgramCode] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState("");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const courseBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadInitialFilters = async () => {
      try {
        const [programsRes, yearsRes, semestersRes] = await Promise.all([
          fetch("/api/public/programs"),
          fetch("/api/public/academic-years"),
          fetch("/api/public/semesters"),
        ]);

        const [programsData, yearsData, semestersData] = await Promise.all([
          programsRes.json(),
          yearsRes.json(),
          semestersRes.json(),
        ]);

        setPrograms(Array.isArray(programsData) ? programsData : []);
        setAcademicYears(Array.isArray(yearsData) ? yearsData : []);
        setSemesters(Array.isArray(semestersData) ? semestersData : []);
      } catch {
        setPrograms([]);
        setAcademicYears([]);
        setSemesters([]);
      }
    };

    loadInitialFilters();
  }, []);

  useEffect(() => {
    setProgramCode("");
    setAcademicYear("");
    setSemester("");
    setCourseQuery("");
    setSelectedCourseCode("");
    setCourseOptions([]);
    setResults([]);
    setStatus(null);
    setShowSuggestions(false);
  }, [resetSignal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!courseBoxRef.current) return;
      if (!courseBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCourseOptions = async () => {
      const trimmedQuery = courseQuery.trim();

      if (trimmedQuery.length < 2) {
        setCourseOptions([]);
        setShowSuggestions(false);
        setLoadingCourses(false);
        return;
      }

      try {
        setLoadingCourses(true);

        const params = new URLSearchParams();
        if (programCode) params.set("programCode", programCode);
        if (academicYear) params.set("academicYear", academicYear);
        if (semester) params.set("semester", semester);
        params.set("query", trimmedQuery);

        const response = await fetch(
          `/api/public/course-options?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();
        const normalized = normalizeCourseOptions(data);
        setCourseOptions(normalized);
        setShowSuggestions(normalized.length > 0);
      } catch {
        setCourseOptions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourseOptions();

    return () => controller.abort();
  }, [programCode, academicYear, semester, courseQuery]);

  const displayedCourseOptions = useMemo(() => {
    return courseOptions.slice(0, 8);
  }, [courseOptions]);

  const groupedResultsBySemester = useMemo(() => {
    const grouped = new Map<string, SearchResult[]>();

    for (const row of results) {
      const key = row.semester === null ? "Unassigned semester" : `Semester ${row.semester}`;
      const existing = grouped.get(key) ?? [];
      existing.push(row);
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries()).sort(([a], [b]) => {
      if (a === "Unassigned semester") return 1;
      if (b === "Unassigned semester") return -1;
      const aNum = Number(a.replace("Semester ", ""));
      const bNum = Number(b.replace("Semester ", ""));
      return aNum - bNum;
    });
  }, [results]);

  const groupedProgramLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const row of results) {
      labels.add(`${row.programTitle} (${row.programCode})`);
    }
    return Array.from(labels);
  }, [results]);

  const shouldShowProgramPerRecord =
    Boolean(selectedCourseCode) || courseQuery.trim().length > 0;

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !programCode &&
      !academicYear &&
      !semester &&
      !selectedCourseCode &&
      !courseQuery.trim()
    ) {
      setStatus("Choose at least one filter.");
      setResults([]);
      return;
    }

    setLoading(true);
    setStatus(null);
    setShowSuggestions(false);

    try {
      const params = new URLSearchParams();

      if (programCode) params.set("programCode", programCode);
      if (academicYear) params.set("academicYear", academicYear);
      if (semester) params.set("semester", semester);

      if (selectedCourseCode) {
        params.set("courseCode", selectedCourseCode);
      } else if (courseQuery.trim()) {
        params.set("query", courseQuery.trim());
      }

      const response = await fetch(
        `/api/public/unified-search?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        setStatus(data?.message || "Search failed.");
        setResults([]);
        return;
      }

      setResults(Array.isArray(data) ? data : []);

      if (!Array.isArray(data) || data.length === 0) {
        setStatus("No matching courses found.");
      }
    } catch {
      setStatus("Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePickCourse = (course: CourseOption) => {
    setSelectedCourseCode(course.code);
    setCourseQuery(`${course.code} — ${course.title}`);
    setCourseOptions([]);
    setShowSuggestions(false);
  };

  return (
    <section className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Program</label>
            <select
              value={programCode}
              onChange={(e) => setProgramCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
            >
              <option value="">All programs</option>
              {programs.map((program) => (
                <option key={program.code} value={program.code}>
                  {program.title} ({program.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Academic Year
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
            >
              <option value="">All academic years</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
            >
              <option value="">All semesters</option>
              {semesters.map((value) => (
                <option key={value} value={String(value)}>
                  Semester {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div ref={courseBoxRef} className="relative space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Course code or title
          </label>
          <input
            type="text"
            value={courseQuery}
            onChange={(e) => {
              setCourseQuery(e.target.value);
              setSelectedCourseCode("");
            }}
            onFocus={() => {
              if (displayedCourseOptions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Start typing a course code or title"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
            autoComplete="off"
          />

          {showSuggestions && displayedCourseOptions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {displayedCourseOptions.map((course) => (
                <button
                  key={course.code}
                  type="button"
                  onClick={() => handlePickCourse(course)}
                  className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 last:border-b-0"
                >
                  <span className="font-semibold text-slate-900">
                    {course.code}
                  </span>
                  <span className="ml-2 text-slate-600">{course.title}</span>
                </button>
              ))}
            </div>
          )}

          {loadingCourses && (
            <p className="text-xs text-slate-500">
              Loading course suggestions...
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setProgramCode("");
              setAcademicYear("");
              setSemester("");
              setCourseQuery("");
              setSelectedCourseCode("");
              setCourseOptions([]);
              setResults([]);
              setStatus(null);
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400"
          >
            Clear all
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      {results.length > 0 && (
        <div className="print-area overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-medium text-slate-700">
              {results.length} result{results.length === 1 ? "" : "s"} found
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Print
            </button>
          </div>

          {semester ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Academic Year</th>
                    <th className="px-4 py-3">Semester</th>
                    <th className="px-4 py-3">Course Code</th>
                    <th className="px-4 py-3">Course Title</th>
                    <th className="px-4 py-3">Hours/Week</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => (
                    <tr
                      key={`${row.programCode}-${row.academicYear}-${row.courseCode}-${row.semester}-${index}`}
                    >
                      <td className="border-t px-4 py-3 font-medium text-slate-900">
                        {row.programTitle} ({row.programCode})
                      </td>
                      <td className="border-t px-4 py-3">{row.academicYear}</td>
                      <td className="border-t px-4 py-3">{row.semester ?? "-"}</td>
                      <td className="border-t px-4 py-3 font-semibold">
                        {row.courseCode}
                      </td>
                      <td className="border-t px-4 py-3">{row.courseTitle}</td>
                      <td className="border-t px-4 py-3">
                        {row.hoursPerWeek ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-5 p-4">
              {!shouldShowProgramPerRecord && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">
                    {groupedProgramLabels.length === 1 ? "Program" : "Programs"}
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {groupedProgramLabels.join(", ")}
                  </p>
                </div>
              )}

              {groupedResultsBySemester.map(([semesterLabel, rows]) => (
                <div
                  key={semesterLabel}
                  className="overflow-hidden rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {semesterLabel}
                    </h3>
                    <span className="text-xs text-slate-600">
                      {rows.length} course{rows.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          {shouldShowProgramPerRecord && (
                            <th className="px-4 py-3">Program</th>
                          )}
                          <th className="px-4 py-3">Academic Year</th>
                          <th className="px-4 py-3">Course Code</th>
                          <th className="px-4 py-3">Course Title</th>
                          <th className="px-4 py-3">Hours/Week</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr
                            key={`${semesterLabel}-${row.programCode}-${row.academicYear}-${row.courseCode}-${index}`}
                          >
                            {shouldShowProgramPerRecord && (
                              <td className="border-t px-4 py-3 font-medium text-slate-900">
                                {row.programTitle} ({row.programCode})
                              </td>
                            )}
                            <td className="border-t px-4 py-3">{row.academicYear}</td>
                            <td className="border-t px-4 py-3 font-semibold">
                              {row.courseCode}
                            </td>
                            <td className="border-t px-4 py-3">{row.courseTitle}</td>
                            <td className="border-t px-4 py-3">
                              {row.hoursPerWeek ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}