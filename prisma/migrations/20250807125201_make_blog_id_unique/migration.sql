/*
  Warnings:

  - A unique constraint covering the columns `[blogId]` on the table `BlogSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BlogSubscription_blogId_key" ON "BlogSubscription"("blogId");
