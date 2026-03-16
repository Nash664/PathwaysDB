import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdatePayload = {
  title?: string;
  preRequisite?: string | null;
  coRequisite?: string | null;
  newCode?: string;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdatePayload;
  const { code } = await params;
  const currentCode = code.trim();
  const title =
    typeof body.title === "string" ? body.title.trim() : undefined;
  const preRequisite =
    typeof body.preRequisite === "string"
      ? body.preRequisite.trim() || null
      : body.preRequisite ?? undefined;
  const coRequisite =
    typeof body.coRequisite === "string"
      ? body.coRequisite.trim() || null
      : body.coRequisite ?? undefined;
  const newCode =
    typeof body.newCode === "string" ? body.newCode.trim() : undefined;

  const existing = await prisma.course.findUnique({
    where: { code: currentCode },
  });
  if (!existing) {
    return NextResponse.json({ message: "Course not found." }, { status: 404 });
  }

  if (newCode && newCode !== currentCode) {
    const codeExists = await prisma.course.findUnique({
      where: { code: newCode },
    });
    if (codeExists) {
      return NextResponse.json(
        { message: "New course code already exists." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          code: newCode,
          title: title ?? existing.title,
          preRequisite:
            preRequisite === undefined ? existing.preRequisite : preRequisite,
          coRequisite:
            coRequisite === undefined ? existing.coRequisite : coRequisite,
        },
      });

      await tx.programCycleCourse.updateMany({
        where: { courseCode: currentCode },
        data: { courseCode: newCode },
      });

      await tx.course.delete({ where: { code: currentCode } });
      return created;
    });

    return NextResponse.json(updated);
  }

  const updated = await prisma.course.update({
    where: { code: currentCode },
    data: {
      title: title ?? existing.title,
      preRequisite:
        preRequisite === undefined ? existing.preRequisite : preRequisite,
      coRequisite:
        coRequisite === undefined ? existing.coRequisite : coRequisite,
    },
  });

  return NextResponse.json(updated);
}
