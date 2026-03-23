import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query")?.trim() ?? "";
  const program = searchParams.get("program")?.trim() ?? "";
  const term = searchParams.get("term")?.trim() ?? "";
  const semesterParam = searchParams.get("semester")?.trim() ?? "";

  const semester =
    semesterParam && !Number.isNaN(Number(semesterParam))
      ? Number(semesterParam)
      : undefined;

  try {
    const rows = await prisma.programCycleCourse.findMany({
      where: {
        ...(semester !== undefined ? { semester } : {}),
        course: query
          ? {
              OR: [
                { code: { contains: query, mode: "insensitive" } },
                { title: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        programCycle: {
          ...(term ? { term } : {}),
          program: program
            ? {
                OR: [
                  { code: { contains: program, mode: "insensitive" } },
                  { title: { contains: program, mode: "insensitive" } },
                ],
              }
            : undefined,
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
        { programCycle: { term: "asc" } },
        { semester: "asc" },
      ],
    });

    const groupedHours = new Map<string, number>();

    rows.forEach((row) => {
      const key = `${row.programCycle.programCode}__${row.programCycle.term}__${row.semester ?? ""}`;
      groupedHours.set(key, (groupedHours.get(key) ?? 0) + (row.hoursPerWeek ?? 0));
    });

    const results = rows.map((row) => {
      const totalKey = `${row.programCycle.programCode}__${row.programCycle.term}__${row.semester ?? ""}`;

      return {
        courseCode: row.course.code,
        courseTitle: row.course.title,
        programCode: row.programCycle.program.code,
        programTitle: row.programCycle.program.title,
        term: row.programCycle.term,
        semester: row.semester,
        hoursPerWeek: row.hoursPerWeek,
        semesterTotalHours: groupedHours.get(totalKey) ?? null,
      };
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { message: "Search failed." },
      { status: 500 }
    );
  }
}