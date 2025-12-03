-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "last_edited_by_id" INTEGER;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_last_edited_by_id_fkey" FOREIGN KEY ("last_edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
