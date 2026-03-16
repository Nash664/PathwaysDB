import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    orderBy: { code: "asc" },
  });

  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = String(body?.code ?? "").trim();
  const title = String(body?.title ?? "").trim();
  const preRequisite =
    typeof body?.preRequisite === "string"
      ? body.preRequisite.trim() || null
      : null;
  const coRequisite =
    typeof body?.coRequisite === "string"
      ? body.coRequisite.trim() || null
      : null;

  if (!code || !title) {
    return NextResponse.json(
      { message: "Course code and title are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.course.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { message: "Course code already exists." },
      { status: 400 }
    );
  }

  const course = await prisma.course.create({
    data: {
      code,
      title,
      preRequisite,
      coRequisite,
    },
  });

  return NextResponse.json(course);
}
