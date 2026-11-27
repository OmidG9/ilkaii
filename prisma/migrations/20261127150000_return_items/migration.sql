-- Per-line return quantities. A ReturnRequest keeps the order-level reason and
-- status; ReturnItem records exactly which order lines and how many units the
-- customer is returning so partial returns can be restocked correctly.
CREATE TABLE `ReturnItem` (
    `id` VARCHAR(191) NOT NULL,
    `returnRequestId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReturnItem_orderItemId_idx`(`orderItemId`),
    UNIQUE INDEX `ReturnItem_returnRequestId_orderItemId_key`(`returnRequestId`, `orderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ReturnItem` ADD CONSTRAINT `ReturnItem_returnRequestId_fkey` FOREIGN KEY (`returnRequestId`) REFERENCES `ReturnRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ReturnItem` ADD CONSTRAINT `ReturnItem_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
