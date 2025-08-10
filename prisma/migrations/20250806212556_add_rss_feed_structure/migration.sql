-- CreateTable
CREATE TABLE "RSSFeed" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RSSFeed_pkey" PRIMARY KEY ("id")
);
