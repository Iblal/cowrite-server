-- CreateTable
CREATE TABLE "collaborators" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_document_id_email_key" ON "collaborators"("document_id", "email");

-- AddForeignKey
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
