/*
  Warnings:

  - You are about to drop the `test_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "test_items";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
