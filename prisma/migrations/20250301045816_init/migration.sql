-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "locationImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "borrowerId" TEXT,
    "purchaseDate" TEXT,
    "warrantyEnd" TEXT,
    "warrantyPlace" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BorrowHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "borrowDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" DATETIME,
    "transferToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BorrowHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowHistory_transferToId_fkey" FOREIGN KEY ("transferToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable
CREATE TABLE "EventDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "condition" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventDevice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BorrowHistory_deviceId_idx" ON "BorrowHistory"("deviceId");

-- CreateIndex
CREATE INDEX "BorrowHistory_userId_idx" ON "BorrowHistory"("userId");

-- CreateIndex
CREATE INDEX "Event_creatorId_idx" ON "Event"("creatorId");

-- CreateIndex
CREATE INDEX "Event_updaterId_idx" ON "Event"("updaterId");

-- CreateIndex
CREATE INDEX "EventDevice_eventId_idx" ON "EventDevice"("eventId");

-- CreateIndex
CREATE INDEX "EventDevice_deviceId_idx" ON "EventDevice"("deviceId");
