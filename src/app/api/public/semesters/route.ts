import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.programCycleCourse.findMany({
      select: { semester: true },
      orderBy: { semester: "asc" },
    });

    const semesters = [
      ...new Set(
        rows
          .map((row) => row.semester)
          .filter((value): value is number => value !== null)
      ),
    ];

    return NextResponse.json(semesters);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}