/*
  Warnings:

  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BorrowHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "borrowDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" DATETIME,
    "transferToId" TEXT,
    "transferFromId" TEXT,
    "transferStatus" TEXT DEFAULT 'pending',
    "borrowContext" TEXT NOT NULL DEFAULT 'personal',
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BorrowHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowHistory_transferToId_fkey" FOREIGN KEY ("transferToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowHistory_transferFromId_fkey" FOREIGN KEY ("transferFromId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BorrowHistory" ("borrowDate", "createdAt", "deviceId", "id", "returnDate", "transferToId", "updatedAt", "userId") SELECT "borrowDate", "createdAt", "deviceId", "id", "returnDate", "transferToId", "updatedAt", "userId" FROM "BorrowHistory";
DROP TABLE "BorrowHistory";
ALTER TABLE "new_BorrowHistory" RENAME TO "BorrowHistory";
CREATE INDEX "BorrowHistory_deviceId_idx" ON "BorrowHistory"("deviceId");
CREATE INDEX "BorrowHistory_userId_idx" ON "BorrowHistory"("userId");
CREATE INDEX "BorrowHistory_eventId_idx" ON "BorrowHistory"("eventId");
CREATE INDEX "BorrowHistory_transferToId_idx" ON "BorrowHistory"("transferToId");
CREATE INDEX "BorrowHistory_transferFromId_idx" ON "BorrowHistory"("transferFromId");
CREATE TABLE "new_Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "locationImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "borrowerId" TEXT,
    "borrowContext" TEXT,
    "eventId" TEXT,
    "purchaseDate" TEXT,
    "warrantyEnd" TEXT,
    "warrantyPlace" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Device_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("borrowerId", "createdAt", "id", "image", "locationImage", "name", "notes", "purchaseDate", "status", "updatedAt", "warrantyEnd", "warrantyPlace") SELECT "borrowerId", "createdAt", "id", "image", "locationImage", "name", "notes", "purchaseDate", "status", "updatedAt", "warrantyEnd", "warrantyPlace" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE INDEX "Device_borrowerId_idx" ON "Device"("borrowerId");
CREATE INDEX "Device_eventId_idx" ON "Device"("eventId");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "creatorId" TEXT NOT NULL,
    "updaterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "createdDate", "creatorId", "id", "returnedDate", "status", "updatedAt", "updaterId") SELECT "createdAt", "createdDate", "creatorId", "id", "returnedDate", "status", "updatedAt", "updaterId" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_creatorId_idx" ON "Event"("creatorId");
CREATE INDEX "Event_updaterId_idx" ON "Event"("updaterId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME
);
INSERT INTO "new_User" ("createdAt", "id", "name", "phone", "updatedAt") SELECT "createdAt", "id", "name", "phone", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
