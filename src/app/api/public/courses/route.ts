import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programCode = searchParams.get("programCode");
  const term = searchParams.get("term");

  if (!programCode || !term) {
    return NextResponse.json(
      { message: "Missing programCode or term." },
      { status: 400 }
    );
  }

  const programCycle = await prisma.programCycle.findUnique({
    where: {
      programCode_term: {
        programCode,
        term,
      },
    },
    include: {
      courses: {
        include: {
          course: true,
        },
        orderBy: { semester: "asc" },
      },
    },
  });

  if (!programCycle) {
    return NextResponse.json([]);
  }

  const courses = programCycle.courses.map((item) => ({
    code: item.course.code,
    title: item.course.title,
    preRequisite: item.course.preRequisite,
    coRequisite: item.course.coRequisite,
    semester: item.semester,
    hoursPerWeek: item.hoursPerWeek,
  }));

  return NextResponse.json(courses);
}
