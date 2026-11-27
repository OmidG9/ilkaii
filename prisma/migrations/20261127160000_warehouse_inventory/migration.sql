-- AlterTable
ALTER TABLE `InventoryMovement` ADD COLUMN `balanceAfter` INTEGER NULL,
    ADD COLUMN `referenceId` VARCHAR(64) NULL,
    ADD COLUMN `referenceType` VARCHAR(40) NULL,
    ADD COLUMN `unitCost` DECIMAL(12, 2) NULL,
    MODIFY `reason` ENUM('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'CANCELLATION', 'PURCHASE', 'STOCKTAKE', 'DAMAGE') NOT NULL;

-- AlterTable
ALTER TABLE `ProductVariant` ADD COLUMN `barcode` VARCHAR(64) NULL,
    ADD COLUMN `costPrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `location` VARCHAR(120) NULL,
    ADD COLUMN `supplierId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `contactName` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(320) NULL,
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `leadTimeDays` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Supplier_name_key`(`name`),
    INDEX `Supplier_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrder` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(40) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedAt` DATETIME(3) NULL,
    `receivedAt` DATETIME(3) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'TOMAN',
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `shippingCost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PurchaseOrder_number_key`(`number`),
    INDEX `PurchaseOrder_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `PurchaseOrder_supplierId_createdAt_idx`(`supplierId`, `createdAt`),
    INDEX `PurchaseOrder_expectedAt_idx`(`expectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `receivedQuantity` INTEGER NOT NULL DEFAULT 0,
    `unitCost` DECIMAL(12, 2) NOT NULL,
    `note` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PurchaseOrderItem_variantId_idx`(`variantId`),
    UNIQUE INDEX `PurchaseOrderItem_purchaseOrderId_variantId_key`(`purchaseOrderId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stocktake` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(40) NOT NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `note` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Stocktake_number_key`(`number`),
    INDEX `Stocktake_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Stocktake_completedAt_idx`(`completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StocktakeItem` (
    `id` VARCHAR(191) NOT NULL,
    `stocktakeId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `expectedQuantity` INTEGER NOT NULL,
    `countedQuantity` INTEGER NULL,
    `difference` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StocktakeItem_variantId_idx`(`variantId`),
    UNIQUE INDEX `StocktakeItem_stocktakeId_variantId_key`(`stocktakeId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `InventoryMovement_reason_createdAt_idx` ON `InventoryMovement`(`reason`, `createdAt`);

-- CreateIndex
CREATE INDEX `InventoryMovement_referenceType_referenceId_idx` ON `InventoryMovement`(`referenceType`, `referenceId`);

-- CreateIndex
CREATE UNIQUE INDEX `ProductVariant_barcode_key` ON `ProductVariant`(`barcode`);

-- CreateIndex
CREATE INDEX `ProductVariant_supplierId_idx` ON `ProductVariant`(`supplierId`);

-- CreateIndex
CREATE INDEX `ProductVariant_stock_lowStockThreshold_idx` ON `ProductVariant`(`stock`, `lowStockThreshold`);

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrder` ADD CONSTRAINT `PurchaseOrder_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrderItem` ADD CONSTRAINT `PurchaseOrderItem_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `PurchaseOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrderItem` ADD CONSTRAINT `PurchaseOrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StocktakeItem` ADD CONSTRAINT `StocktakeItem_stocktakeId_fkey` FOREIGN KEY (`stocktakeId`) REFERENCES `Stocktake`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StocktakeItem` ADD CONSTRAINT `StocktakeItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
