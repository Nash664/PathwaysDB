import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdatePayload = {
  courseCode?: string;
  title?: string;
  preRequisite?: string | null;
  semester?: number | null;
  hoursPerWeek?: number | null;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdatePayload;

    const existing = await prisma.programCycleCourse.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Course offering not found." },
        { status: 404 }
      );
    }

    const nextCourseCode =
      typeof body.courseCode === "string" && body.courseCode.trim()
        ? body.courseCode.trim().toUpperCase()
        : existing.courseCode;

    const nextTitle =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : existing.course.title;

    const nextPreReq =
      typeof body.preRequisite === "string"
        ? body.preRequisite.trim() || null
        : existing.course.preRequisite;

    const nextSemester =
      typeof body.semester === "number" && Number.isFinite(body.semester)
        ? Math.round(body.semester)
        : null;

    const nextHoursPerWeek =
      typeof body.hoursPerWeek === "number" &&
      Number.isFinite(body.hoursPerWeek)
        ? Math.round(body.hoursPerWeek)
        : null;

    if (nextSemester !== null && nextSemester < 1) {
      return NextResponse.json(
        { message: "Semester must be 1 or greater." },
        { status: 400 }
      );
    }

    if (nextHoursPerWeek !== null && nextHoursPerWeek < 0) {
      return NextResponse.json(
        { message: "Weekly hours cannot be negative." },
        { status: 400 }
      );
    }

    // 🔥 If course code changed → upsert new course
    if (nextCourseCode !== existing.courseCode) {
      await prisma.course.upsert({
        where: { code: nextCourseCode },
        update: {
          title: nextTitle,
          preRequisite: nextPreReq,
        },
        create: {
          code: nextCourseCode,
          title: nextTitle,
          preRequisite: nextPreReq,
        },
      });

      // prevent duplicate in same academic year
      const duplicate = await prisma.programCycleCourse.findUnique({
        where: {
          programCycleId_courseCode: {
            programCycleId: existing.programCycleId,
            courseCode: nextCourseCode,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          {
            message:
              "Another course with this code already exists in the selected academic year.",
          },
          { status: 409 }
        );
      }
    } else {
      // update existing course info
      await prisma.course.update({
        where: { code: existing.courseCode },
        data: {
          title: nextTitle,
          preRequisite: nextPreReq,
        },
      });
    }

    // update offering
    const updated = await prisma.programCycleCourse.update({
      where: { id },
      data: {
        courseCode: nextCourseCode,
        semester: nextSemester,
        hoursPerWeek: nextHoursPerWeek,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { message: "Failed to update course offering." },
      { status: 500 }
    );
  }
}

// ✅ DELETE (remove from this academic year only)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const existing = await prisma.programCycleCourse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Course offering not found." },
        { status: 404 }
      );
    }

    await prisma.programCycleCourse.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Course deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete course." },
      { status: 500 }
    );
  }
}