-- CreateTable
CREATE TABLE "BlogSubscription" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',

    CONSTRAINT "BlogSubscription_pkey" PRIMARY KEY ("id")
);
