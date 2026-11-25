-- AlterTable
ALTER TABLE `auditlog` ADD COLUMN `afterJson` LONGTEXT NULL,
    ADD COLUMN `beforeJson` LONGTEXT NULL,
    ADD COLUMN `requestId` VARCHAR(64) NULL;

-- AlterTable
ALTER TABLE `role` MODIFY `code` VARCHAR(64) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `adminNote` TEXT NULL,
    ADD COLUMN `lastActivityAt` DATETIME(3) NULL,
    ADD COLUMN `marketingOptIn` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `role` VARCHAR(64) NOT NULL DEFAULT 'CUSTOMER';

-- CreateTable
CREATE TABLE `CmsPage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `metaTitle` VARCHAR(200) NULL,
    `metaDescription` VARCHAR(400) NULL,
    `ogImage` VARCHAR(1024) NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CmsPage_slug_key`(`slug`),
    INDEX `CmsPage_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `CmsPage_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomepageSection` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('HERO', 'BANNER', 'FEATURED_CATEGORIES', 'FEATURED_PRODUCTS', 'NEW_ARRIVALS', 'BEST_SELLERS', 'PROMOTIONAL', 'SEASONAL_COLLECTION', 'TESTIMONIALS', 'CUSTOM_CONTENT') NOT NULL,
    `title` VARCHAR(200) NULL,
    `subtitle` VARCHAR(400) NULL,
    `config` JSON NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HomepageSection_isEnabled_displayOrder_idx`(`isEnabled`, `displayOrder`),
    INDEX `HomepageSection_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(400) NULL,
    `image` VARCHAR(1024) NOT NULL,
    `mobileImage` VARCHAR(1024) NULL,
    `href` VARCHAR(1024) NULL,
    `placement` VARCHAR(40) NOT NULL DEFAULT 'HOME',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Banner_placement_isActive_displayOrder_idx`(`placement`, `isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Menu` (
    `id` VARCHAR(191) NOT NULL,
    `location` ENUM('HEADER', 'FOOTER', 'MOBILE') NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Menu_location_key`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItem` (
    `id` VARCHAR(191) NOT NULL,
    `menuId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `label` VARCHAR(120) NOT NULL,
    `href` VARCHAR(1024) NOT NULL,
    `target` VARCHAR(10) NOT NULL DEFAULT '_self',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MenuItem_menuId_parentId_displayOrder_idx`(`menuId`, `parentId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `publicId` VARCHAR(512) NULL,
    `altText` VARCHAR(300) NULL,
    `mimeType` VARCHAR(120) NOT NULL,
    `size` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `folder` VARCHAR(160) NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MediaAsset_url_key`(`url`),
    INDEX `MediaAsset_createdAt_idx`(`createdAt`),
    INDEX `MediaAsset_mimeType_idx`(`mimeType`),
    INDEX `MediaAsset_folder_idx`(`folder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `title` VARCHAR(220) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` VARCHAR(1024) NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `authorId` VARCHAR(191) NULL,
    `tags` VARCHAR(500) NULL,
    `readingMinutes` INTEGER NOT NULL DEFAULT 4,
    `metaTitle` VARCHAR(220) NULL,
    `metaDescription` VARCHAR(400) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticsSession` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `entryPath` VARCHAR(512) NULL,
    `exitPath` VARCHAR(512) NULL,
    `referrer` VARCHAR(1024) NULL,
    `utmSource` VARCHAR(160) NULL,
    `utmMedium` VARCHAR(160) NULL,
    `utmCampaign` VARCHAR(160) NULL,
    `device` VARCHAR(24) NULL,
    `browser` VARCHAR(48) NULL,
    `pageViews` INTEGER NOT NULL DEFAULT 0,
    `eventCount` INTEGER NOT NULL DEFAULT 0,
    `isBounced` BOOLEAN NOT NULL DEFAULT true,
    `consent` BOOLEAN NOT NULL DEFAULT true,
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AnalyticsSession_firstSeenAt_idx`(`firstSeenAt`),
    INDEX `AnalyticsSession_lastSeenAt_idx`(`lastSeenAt`),
    INDEX `AnalyticsSession_customerId_idx`(`customerId`),
    INDEX `AnalyticsSession_utmSource_utmCampaign_idx`(`utmSource`, `utmCampaign`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticsEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(64) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `name` VARCHAR(48) NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `referrer` VARCHAR(1024) NULL,
    `device` VARCHAR(24) NULL,
    `browser` VARCHAR(48) NULL,
    `utmSource` VARCHAR(160) NULL,
    `utmMedium` VARCHAR(160) NULL,
    `utmCampaign` VARCHAR(160) NULL,
    `productId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `variantId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AnalyticsEvent_eventId_key`(`eventId`),
    INDEX `AnalyticsEvent_name_createdAt_idx`(`name`, `createdAt`),
    INDEX `AnalyticsEvent_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
    INDEX `AnalyticsEvent_productId_name_createdAt_idx`(`productId`, `name`, `createdAt`),
    INDEX `AnalyticsEvent_categoryId_name_createdAt_idx`(`categoryId`, `name`, `createdAt`),
    INDEX `AnalyticsEvent_createdAt_idx`(`createdAt`),
    INDEX `AnalyticsEvent_utmSource_createdAt_idx`(`utmSource`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticsDailyAggregate` (
    `id` VARCHAR(191) NOT NULL,
    `day` DATE NOT NULL,
    `visitors` INTEGER NOT NULL DEFAULT 0,
    `sessions` INTEGER NOT NULL DEFAULT 0,
    `pageViews` INTEGER NOT NULL DEFAULT 0,
    `productViews` INTEGER NOT NULL DEFAULT 0,
    `addToCarts` INTEGER NOT NULL DEFAULT 0,
    `checkouts` INTEGER NOT NULL DEFAULT 0,
    `purchases` INTEGER NOT NULL DEFAULT 0,
    `revenue` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AnalyticsDailyAggregate_day_key`(`day`),
    INDEX `AnalyticsDailyAggregate_day_idx`(`day`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticsConsent` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(64) NULL,
    `customerId` VARCHAR(191) NULL,
    `analytics` BOOLEAN NOT NULL DEFAULT false,
    `marketing` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AnalyticsConsent_sessionId_key`(`sessionId`),
    INDEX `AnalyticsConsent_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'BANNER') NOT NULL DEFAULT 'EMAIL',
    `status` ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `subject` VARCHAR(250) NULL,
    `content` LONGTEXT NOT NULL,
    `audience` VARCHAR(120) NULL,
    `couponId` VARCHAR(191) NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `utmSource` VARCHAR(160) NULL,
    `utmMedium` VARCHAR(160) NULL,
    `utmCampaign` VARCHAR(160) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MarketingCampaign_status_startsAt_idx`(`status`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(320) NULL,
    `phone` VARCHAR(20) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED') NOT NULL DEFAULT 'PENDING',
    `source` VARCHAR(120) NULL,
    `customerId` VARCHAR(191) NULL,
    `consentAt` DATETIME(3) NULL,
    `unsubscribedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    UNIQUE INDEX `NewsletterSubscriber_phone_key`(`phone`),
    INDEX `NewsletterSubscriber_status_idx`(`status`),
    INDEX `NewsletterSubscriber_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationLog` (
    `id` VARCHAR(191) NOT NULL,
    `channel` ENUM('EMAIL', 'SMS') NOT NULL,
    `recipient` VARCHAR(320) NOT NULL,
    `template` VARCHAR(120) NULL,
    `subject` VARCHAR(250) NULL,
    `status` ENUM('QUEUED', 'SENT', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'QUEUED',
    `provider` VARCHAR(80) NOT NULL,
    `error` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationLog_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `NotificationLog_recipient_createdAt_idx`(`recipient`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationSecret` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(120) NOT NULL,
    `encryptedValue` LONGTEXT NOT NULL,
    `maskedHint` VARCHAR(64) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IntegrationSecret_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BackgroundJob` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `payload` TEXT NULL,
    `result` TEXT NULL,
    `error` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BackgroundJob_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `BackgroundJob_name_createdAt_idx`(`name`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemEvent` (
    `id` VARCHAR(191) NOT NULL,
    `level` ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    `type` VARCHAR(80) NOT NULL,
    `message` VARCHAR(512) NOT NULL,
    `context` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemEvent_level_createdAt_idx`(`level`, `createdAt`),
    INDEX `SystemEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_entity_entityId_idx` ON `AuditLog`(`entity`, `entityId`);

-- AddForeignKey
ALTER TABLE `MenuItem` ADD CONSTRAINT `MenuItem_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `Menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItem` ADD CONSTRAINT `MenuItem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `MenuItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnalyticsSession` ADD CONSTRAINT `AnalyticsSession_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnalyticsEvent` ADD CONSTRAINT `AnalyticsEvent_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `AnalyticsSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnalyticsEvent` ADD CONSTRAINT `AnalyticsEvent_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingCampaign` ADD CONSTRAINT `MarketingCampaign_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

