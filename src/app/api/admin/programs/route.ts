import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateProgramPayload = {
  code?: string;
  title?: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const programs = await prisma.program.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json(programs);
  } catch {
    return NextResponse.json(
      { message: "Failed to load programs." },
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
    const body = (await request.json()) as CreateProgramPayload;

    const code = body.code?.trim().toUpperCase() ?? "";
    const title = body.title?.trim() ?? "";

    if (!code || !title) {
      return NextResponse.json(
        { message: "Program code and program title are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.program.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Program code already exists." },
        { status: 409 }
      );
    }

    const program = await prisma.program.create({
      data: {
        code,
        title,
      },
    });

    return NextResponse.json(program);
  } catch {
    return NextResponse.json(
      { message: "Failed to create program." },
      { status: 500 }
    );
  }
}