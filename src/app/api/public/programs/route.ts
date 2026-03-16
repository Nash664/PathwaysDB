import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: { title: "asc" },
    select: {
      code: true,
      title: true,
    },
  });

  return NextResponse.json(programs);
}
