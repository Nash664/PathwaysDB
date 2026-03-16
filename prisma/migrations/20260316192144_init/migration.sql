-- CreateTable
CREATE TABLE "School" (
    "code" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Program" (
    "code" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "schoolCode" TEXT,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Course" (
    "code" VARCHAR(30) NOT NULL,
    "title" TEXT NOT NULL,
    "preRequisite" TEXT,
    "coRequisite" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ProgramCycle" (
    "id" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "term" TEXT NOT NULL,

    CONSTRAINT "ProgramCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCycleCourse" (
    "id" TEXT NOT NULL,
    "programCycleId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "semester" INTEGER,
    "hoursPerWeek" INTEGER,

    CONSTRAINT "ProgramCycleCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCycle_programCode_term_key" ON "ProgramCycle"("programCode", "term");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCycleCourse_programCycleId_courseCode_key" ON "ProgramCycleCourse"("programCycleId", "courseCode");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_schoolCode_fkey" FOREIGN KEY ("schoolCode") REFERENCES "School"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCycle" ADD CONSTRAINT "ProgramCycle_programCode_fkey" FOREIGN KEY ("programCode") REFERENCES "Program"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCycleCourse" ADD CONSTRAINT "ProgramCycleCourse_programCycleId_fkey" FOREIGN KEY ("programCycleId") REFERENCES "ProgramCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCycleCourse" ADD CONSTRAINT "ProgramCycleCourse_courseCode_fkey" FOREIGN KEY ("courseCode") REFERENCES "Course"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
