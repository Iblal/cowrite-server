/*
  Warnings:

  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "name" TEXT DEFAULT 'User' NOT NULL;

-- DropDefault
ALTER TABLE "users" ALTER COLUMN "name" DROP DEFAULT;
