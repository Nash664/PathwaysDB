import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const programCode = searchParams.get("programCode")?.trim() ?? "";
  const term = searchParams.get("term")?.trim() ?? "";

  if (!programCode || !term) {
    return NextResponse.json([]);
  }

  try {
    const cycle = await prisma.programCycle.findUnique({
      where: {
        programCode_term: {
          programCode,
          term,
        },
      },
      select: {
        id: true,
      },
    });

    if (!cycle) {
      return NextResponse.json([]);
    }

    const rows = await prisma.programCycleCourse.findMany({
      where: {
        programCycleId: cycle.id,
      },
      include: {
        course: true,
      },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        courseCode: row.course.code,
        courseTitle: row.course.title,
        preRequisite: row.course.preRequisite,
        semester: row.semester,
        hoursPerWeek: row.hoursPerWeek,
      }))
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to load course offerings." },
      { status: 500 }
    );
  }
}