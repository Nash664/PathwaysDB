import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const programCode = searchParams.get("programCode")?.trim() ?? "";
  const academicYear = searchParams.get("academicYear")?.trim() ?? "";
  const courseCode = searchParams.get("courseCode")?.trim() ?? "";
  const query = searchParams.get("query")?.trim() ?? "";
  const semesterParam = searchParams.get("semester")?.trim() ?? "";

  const semester =
    semesterParam && !Number.isNaN(Number(semesterParam))
      ? Number(semesterParam)
      : undefined;

  try {
    const rows = await prisma.programCycleCourse.findMany({
      where: {
        ...(semester !== undefined ? { semester } : {}),
        ...(courseCode
          ? { courseCode }
          : query
          ? {
              course: {
                OR: [
                  { code: { contains: query, mode: "insensitive" } },
                  { title: { contains: query, mode: "insensitive" } },
                ],
              },
            }
          : {}),
        programCycle: {
          ...(programCode ? { programCode } : {}),
          ...(academicYear ? { term: academicYear } : {}),
        },
      },
      include: {
        course: true,
        programCycle: {
          include: {
            program: true,
          },
        },
      },
      orderBy: [
        { programCycle: { programCode: "asc" } },
        { programCycle: { term: "desc" } },
        { semester: "asc" },
        { courseCode: "asc" },
      ],
    });

    const totals = new Map<string, number>();

    for (const row of rows) {
      const key = `${row.programCycle.programCode}-${row.programCycle.term}-${row.semester ?? ""}`;
      totals.set(key, (totals.get(key) ?? 0) + (row.hoursPerWeek ?? 0));
    }

    return NextResponse.json(
      rows.map((row) => {
        const key = `${row.programCycle.programCode}-${row.programCycle.term}-${row.semester ?? ""}`;

        return {
          programCode: row.programCycle.program.code,
          programTitle: row.programCycle.program.title,
          academicYear: row.programCycle.term,
          semester: row.semester,
          courseCode: row.course.code,
          courseTitle: row.course.title,
          hoursPerWeek: row.hoursPerWeek,
          semesterTotalHours: totals.get(key) ?? null,
        };
      })
    );
  } catch {
    return NextResponse.json(
      { message: "Search failed." },
      { status: 500 }
    );
  }
}