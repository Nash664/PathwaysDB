import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdatePayload = {
  semester?: number | null;
  hoursPerWeek?: number | null;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdatePayload;
  const semester =
    typeof body.semester === "number" ? Math.round(body.semester) : null;
  const hoursPerWeek =
    typeof body.hoursPerWeek === "number" ? Math.round(body.hoursPerWeek) : null;

  const updated = await prisma.programCycleCourse.update({
    where: { id: params.id },
    data: {
      semester,
      hoursPerWeek,
    },
  });

  return NextResponse.json(updated);
}
