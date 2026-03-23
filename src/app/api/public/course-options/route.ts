import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const programCode = searchParams.get("programCode")?.trim() ?? "";
  const academicYear = searchParams.get("academicYear")?.trim() ?? "";
  const semesterParam = searchParams.get("semester")?.trim() ?? "";
  const query = searchParams.get("query")?.trim() ?? "";

  const semester =
    semesterParam && !Number.isNaN(Number(semesterParam))
      ? Number(semesterParam)
      : undefined;

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const rows = await prisma.programCycleCourse.findMany({
      where: {
        ...(semester !== undefined ? { semester } : {}),
        programCycle: {
          ...(programCode ? { programCode } : {}),
          ...(academicYear ? { term: academicYear } : {}),
        },
        course: {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      include: {
        course: true,
      },
      orderBy: [{ courseCode: "asc" }],
      take: 20,
    });

    const unique = new Map<string, { code: string; title: string }>();

    for (const row of rows) {
      unique.set(row.course.code, {
        code: row.course.code,
        title: row.course.title,
      });
    }

    return NextResponse.json(Array.from(unique.values()));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}