-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "activationToken" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "activatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outline" (
    "id" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "tree" JSONB NOT NULL,

    CONSTRAINT "Outline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentNode" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "archiveDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_emailAddress_key" ON "Account"("emailAddress");
