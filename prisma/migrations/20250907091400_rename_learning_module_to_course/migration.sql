/*
  Warnings:

  - You are about to drop the `LearningModule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Registration" DROP CONSTRAINT "Registration_formationId_fkey";

-- DropTable
DROP TABLE "public"."LearningModule";

-- CreateTable
CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "duration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
