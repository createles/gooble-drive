-- DropForeignKey
ALTER TABLE "Share" DROP CONSTRAINT "Share_fileId_fkey";

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
