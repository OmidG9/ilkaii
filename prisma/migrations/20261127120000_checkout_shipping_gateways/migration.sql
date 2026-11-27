-- Checkout shipping options and selectable payment gateways.
ALTER TABLE `Order`
  MODIFY `shippingMethod` ENUM('POSTAL', 'COURIER', 'PICKUP', 'FLAT', 'ALOPEYK', 'PISHTAZ', 'TIPAX') NOT NULL DEFAULT 'PISHTAZ';

ALTER TABLE `Order`
  ADD COLUMN `paymentGateway` VARCHAR(191) NULL;
