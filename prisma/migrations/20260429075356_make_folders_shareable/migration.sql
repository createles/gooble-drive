-- AlterTable
ALTER TABLE "Share" ADD COLUMN     "folderId" INTEGER,
ALTER COLUMN "fileId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
