import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const programCode = searchParams.get("programCode")?.trim();
  const term = searchParams.get("term")?.trim();

  if (!programCode || !term) {
    return NextResponse.json(
      { message: "Missing programCode or term." },
      { status: 400 }
    );
  }

  const programCycle = await prisma.programCycle.findUnique({
    where: { programCode_term: { programCode, term } },
  });

  if (!programCycle) {
    return NextResponse.json([]);
  }

  const offerings = await prisma.programCycleCourse.findMany({
    where: { programCycleId: programCycle.id },
    include: { course: true },
    orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
  });

  return NextResponse.json(
    offerings.map((row) => ({
      id: row.id,
      courseCode: row.course.code,
      courseTitle: row.course.title,
      preRequisite: row.course.preRequisite,
      coRequisite: row.course.coRequisite,
      semester: row.semester,
      hoursPerWeek: row.hoursPerWeek,
    }))
  );
}
