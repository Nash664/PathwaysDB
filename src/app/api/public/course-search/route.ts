import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseCodeRaw = searchParams.get("courseCode");

  if (!courseCodeRaw) {
    return NextResponse.json(
      { message: "Missing courseCode." },
      { status: 400 }
    );
  }

  const courseCode = courseCodeRaw.trim();

  const results = await prisma.programCycleCourse.findMany({
    where: {
      courseCode,
    },
    include: {
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

  const totals = await prisma.programCycleCourse.groupBy({
    by: ["programCycleId", "semester"],
    _sum: { hoursPerWeek: true },
  });

  const totalMap = new Map(
    totals.map((row) => [
      `${row.programCycleId}__${row.semester ?? "na"}`,
      row._sum.hoursPerWeek ?? null,
    ])
  );

  return NextResponse.json(
    results.map((row) => ({
      programCode: row.programCycle.programCode,
      programTitle: row.programCycle.program.title,
      term: row.programCycle.term,
      semester: row.semester,
      hoursPerWeek: row.hoursPerWeek,
      semesterTotalHours:
        totalMap.get(`${row.programCycleId}__${row.semester ?? "na"}`) ?? null,
    }))
  );
}
