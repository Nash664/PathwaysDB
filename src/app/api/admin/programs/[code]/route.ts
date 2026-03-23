import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdateProgramPayload = {
  code?: string;
  title?: string;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code: originalCode } = await context.params;
    const body = (await request.json()) as UpdateProgramPayload;

    const nextCode = body.code?.trim().toUpperCase() ?? "";
    const nextTitle = body.title?.trim() ?? "";

    if (!nextCode || !nextTitle) {
      return NextResponse.json(
        { message: "Program code and program title are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.program.findUnique({
      where: { code: originalCode },
      include: {
        programCycles: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Program not found." },
        { status: 404 }
      );
    }

    if (nextCode !== originalCode) {
      const duplicate = await prisma.program.findUnique({
        where: { code: nextCode },
      });

      if (duplicate) {
        return NextResponse.json(
          { message: "Another program with this code already exists." },
          { status: 409 }
        );
      }
    }

    if (nextCode !== originalCode && existing.programCycles.length > 0) {
      return NextResponse.json(
        {
          message:
            "Program code cannot be changed because this program already has academic years or course offerings. You can still update the program title.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.program.update({
      where: { code: originalCode },
      data: {
        code: nextCode,
        title: nextTitle,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { message: "Failed to update program." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await context.params;

    const existing = await prisma.program.findUnique({
      where: { code },
      include: {
        programCycles: {
          include: {
            courses: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Program not found." },
        { status: 404 }
      );
    }

    const hasOfferings = existing.programCycles.some(
      (cycle) => cycle.courses.length > 0
    );

    if (hasOfferings) {
      return NextResponse.json(
        {
          message:
            "Cannot delete a program that still has courses being offered.",
        },
        { status: 409 }
      );
    }

    await prisma.programCycle.deleteMany({
      where: {
        programCode: code,
      },
    });

    await prisma.program.delete({
      where: { code },
    });

    return NextResponse.json({
      message: "Program deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete program." },
      { status: 500 }
    );
  }
}