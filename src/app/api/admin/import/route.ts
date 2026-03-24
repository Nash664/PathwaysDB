import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CourseRow = {
  Crs_Code: string;
  Crs_Title: string;
  "Pre-Requisite"?: string;
  Co_Requisite?: string;
};

type ProgramRow = {
  Progr_Code: string;
  Progr_Title: string;
  Sch_Code?: string;
};

type SchoolRow = {
  Sch_Code: string;
  Sch_Name: string;
};

type TermProgramRow = {
  Progr_Code: string;
  Term: string;
  Crs_Code: string;
  Semester?: number;
  Hrs_per_Wk?: number;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Missing file." }, { status: 400 });
    }
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { message: "Wrong file or format." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    } catch {
      return NextResponse.json(
        { message: "Wrong file or format." },
        { status: 400 }
      );
    }

    const requiredSheets = {
      Courses: ["Crs_Code", "Crs_Title"],
      Program: ["Progr_Code", "Progr_Title"],
      School: ["Sch_Code", "Sch_Name"],
      Term_Program: ["Progr_Code", "Term", "Crs_Code"],
    };

    for (const [sheetName, requiredHeaders] of Object.entries(
      requiredSheets
    )) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        return NextResponse.json(
          { message: "Wrong file or format." },
          { status: 400 }
        );
      }

      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      const headers = (rows[0] ?? []) as string[];
      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header)
      );
      if (missingHeaders.length) {
        return NextResponse.json(
          {
            message: "Wrong file or format.",
          },
          { status: 400 }
        );
      }
    }

    const courses = XLSX.utils.sheet_to_json<CourseRow>(
      workbook.Sheets["Courses"]
    );
    const programs = XLSX.utils.sheet_to_json<ProgramRow>(
      workbook.Sheets["Program"]
    );
    const schools = XLSX.utils.sheet_to_json<SchoolRow>(
      workbook.Sheets["School"]
    );
    const termPrograms = XLSX.utils.sheet_to_json<TermProgramRow>(
      workbook.Sheets["Term_Program"]
    );

    await prisma.$transaction(async (tx) => {
      await tx.programCycleCourse.deleteMany();
      await tx.programCycle.deleteMany();
      await tx.course.deleteMany();
      await tx.program.deleteMany();
      await tx.school.deleteMany();

      const validSchools = schools
        .map((row) => ({
          code: row.Sch_Code?.trim(),
          name: row.Sch_Name?.trim(),
        }))
        .filter((row) => row.code && row.name);

      if (validSchools.length) {
        await tx.school.createMany({
          data: validSchools,
          skipDuplicates: true,
        });
      }

      const validPrograms = programs
        .map((row) => ({
          code: row.Progr_Code?.trim(),
          title: row.Progr_Title?.trim(),
          schoolCode: row.Sch_Code?.trim() || null,
        }))
        .filter((row) => row.code && row.title);

      if (validPrograms.length) {
        await tx.program.createMany({
          data: validPrograms,
          skipDuplicates: true,
        });
      }

      const validCourses = courses
        .map((row) => ({
          code: row.Crs_Code?.trim(),
          title: row.Crs_Title?.trim(),
          preRequisite: row["Pre-Requisite"]?.trim() || null,
          coRequisite: row.Co_Requisite?.trim() || null,
        }))
        .filter((row) => row.code && row.title);

      if (validCourses.length) {
        await tx.course.createMany({
          data: validCourses,
          skipDuplicates: true,
        });
      }

      const programCyclePairs = Array.from(
        new Map(
          termPrograms
            .filter((row) => row.Progr_Code && row.Term)
            .map((row) => [
              `${row.Progr_Code.trim()}__${row.Term.trim()}`,
              {
                programCode: row.Progr_Code.trim(),
                term: row.Term.trim(),
              },
            ])
        ).values()
      );

      if (programCyclePairs.length) {
        await tx.programCycle.createMany({
          data: programCyclePairs,
          skipDuplicates: true,
        });
      }

      const programCycles = await tx.programCycle.findMany();
      const cycleMap = new Map(
        programCycles.map((cycle) => [
          `${cycle.programCode}__${cycle.term}`,
          cycle.id,
        ])
      );

      const programCycleCourses = termPrograms
        .filter((row) => row.Progr_Code && row.Term && row.Crs_Code)
        .map((row) => ({
          programCycleId:
            cycleMap.get(`${row.Progr_Code.trim()}__${row.Term.trim()}`) ?? "",
          courseCode: row.Crs_Code.trim(),
          semester:
            typeof row.Semester === "number" ? Math.round(row.Semester) : null,
          hoursPerWeek:
            typeof row.Hrs_per_Wk === "number"
              ? Math.round(row.Hrs_per_Wk)
              : null,
        }))
        .filter((row) => row.programCycleId);

      if (programCycleCourses.length) {
        await tx.programCycleCourse.createMany({
          data: programCycleCourses,
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ message: "Import complete." });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      {
        message: "Import failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
