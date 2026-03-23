import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateCoursePayload = {
  code?: string;
  title?: string;
  preRequisite?: string | null;
  programCode?: string;
  academicYear?: string;
  semester?: number | null;
  hoursPerWeek?: number | null;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json(courses);
  } catch {
    return NextResponse.json(
      { message: "Failed to load courses." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateCoursePayload;

    const code = body.code?.trim().toUpperCase() ?? "";
    const title = body.title?.trim() ?? "";
    const preRequisite = body.preRequisite?.trim() || null;
    const programCode = body.programCode?.trim() ?? "";
    const academicYear = body.academicYear?.trim() ?? "";

    const semester =
      typeof body.semester === "number" && Number.isFinite(body.semester)
        ? Math.round(body.semester)
        : null;

    const hoursPerWeek =
      typeof body.hoursPerWeek === "number" && Number.isFinite(body.hoursPerWeek)
        ? Math.round(body.hoursPerWeek)
        : null;

    if (!code || !title || !programCode || !academicYear) {
      return NextResponse.json(
        {
          message:
            "Course code, course title, program, and academic year are required.",
        },
        { status: 400 }
      );
    }

    if (semester !== null && semester < 1) {
      return NextResponse.json(
        { message: "Semester must be 1 or greater." },
        { status: 400 }
      );
    }

    if (hoursPerWeek !== null && hoursPerWeek < 0) {
      return NextResponse.json(
        { message: "Weekly hours cannot be negative." },
        { status: 400 }
      );
    }

    const program = await prisma.program.findUnique({
      where: { code: programCode },
    });

    if (!program) {
      return NextResponse.json(
        { message: "Selected program was not found." },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.course.upsert({
        where: { code },
        update: {
          title,
          preRequisite,
        },
        create: {
          code,
          title,
          preRequisite,
        },
      });

      const cycle = await tx.programCycle.upsert({
        where: {
          programCode_term: {
            programCode,
            term: academicYear,
          },
        },
        update: {},
        create: {
          programCode,
          term: academicYear,
        },
      });

      const existingOffering = await tx.programCycleCourse.findUnique({
        where: {
          programCycleId_courseCode: {
            programCycleId: cycle.id,
            courseCode: code,
          },
        },
      });

      if (existingOffering) {
        return {
          duplicate: true as const,
          offering: existingOffering,
        };
      }

      const offering = await tx.programCycleCourse.create({
        data: {
          programCycleId: cycle.id,
          courseCode: code,
          semester,
          hoursPerWeek,
        },
      });

      return {
        duplicate: false as const,
        offering,
      };
    });

    if (result.duplicate) {
      return NextResponse.json(
        {
          message:
            "This course already exists in the selected academic year for that program.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Course created and added successfully.",
      offering: result.offering,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to create course." },
      { status: 500 }
    );
  }
}