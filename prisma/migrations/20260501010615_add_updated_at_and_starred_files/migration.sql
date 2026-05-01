/*
  Warnings:

  - You are about to drop the column `lastAccessed` on the `Folder` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isStarred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "lastAccessed";
