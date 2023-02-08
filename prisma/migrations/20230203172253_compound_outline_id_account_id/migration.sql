/*
  Warnings:

  - The primary key for the `Outline` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `accountId` to the `Outline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Outline" DROP CONSTRAINT "Outline_pkey",
ADD COLUMN     "accountId" TEXT NOT NULL,
ADD CONSTRAINT "Outline_pkey" PRIMARY KEY ("id", "accountId");
