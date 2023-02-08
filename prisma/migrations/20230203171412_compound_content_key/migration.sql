/*
  Warnings:

  - The primary key for the `ContentNode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `accountId` to the `ContentNode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContentNode" DROP CONSTRAINT "ContentNode_pkey",
ADD COLUMN     "accountId" TEXT NOT NULL,
ADD CONSTRAINT "ContentNode_pkey" PRIMARY KEY ("id", "accountId");
