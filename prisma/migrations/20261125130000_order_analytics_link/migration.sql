-- AlterTable
ALTER TABLE `order` ADD COLUMN `analyticsSessionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Order_analyticsSessionId_idx` ON `Order`(`analyticsSessionId`);

