-- Hot-path composite indexes for scale:
-- order list per user (newest first), product reviews (approved, per product),
-- storefront product filters (active + category/brand, bestseller ordering).

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_productId_approved_idx" ON "Review"("productId", "approved");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isActive_categoryId_idx" ON "Product"("isActive", "categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isActive_brandId_idx" ON "Product"("isActive", "brandId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isActive_soldCount_idx" ON "Product"("isActive", "soldCount");
