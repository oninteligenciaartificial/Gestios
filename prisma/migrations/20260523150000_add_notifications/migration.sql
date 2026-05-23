-- CreateTable
CREATE TABLE "notifications" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId"         TEXT,
  "type"           TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "read"           BOOLEAN NOT NULL DEFAULT false,
  "link"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_organizationId_read_createdAt_idx"
  ON "notifications"("organizationId", "read", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
