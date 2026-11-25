-- AlterTable
ALTER TABLE `newslettersubscriber` ADD COLUMN `unsubscribeToken` VARCHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `NewsletterSubscriber_unsubscribeToken_key` ON `NewsletterSubscriber`(`unsubscribeToken`);

