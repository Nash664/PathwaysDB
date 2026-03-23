import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.programCycle.findMany({
      select: { term: true },
      orderBy: { term: "desc" },
    });

    const years = [...new Set(rows.map((row) => row.term))];
    return NextResponse.json(years);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}