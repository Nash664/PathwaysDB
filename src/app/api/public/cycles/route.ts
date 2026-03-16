import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programCode = searchParams.get("programCode");
  if (!programCode) {
    return NextResponse.json(
      { message: "Missing programCode." },
      { status: 400 }
    );
  }

  const cycles = await prisma.programCycle.findMany({
    where: { programCode },
    orderBy: { term: "asc" },
    select: { term: true },
    distinct: ["term"],
  });

  return NextResponse.json(cycles.map((cycle) => cycle.term));
}
