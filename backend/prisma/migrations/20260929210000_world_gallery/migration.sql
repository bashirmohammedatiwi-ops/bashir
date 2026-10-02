-- صور صفحة الفئات الخاصة بكل عالم، مستقلة عن البنرات
CREATE TABLE "WorldGalleryImage" (
  "id" TEXT NOT NULL,
  "worldId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorldGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorldGalleryImage_worldId_position_idx" ON "WorldGalleryImage"("worldId", "position");
CREATE INDEX "WorldGalleryImage_mediaId_idx" ON "WorldGalleryImage"("mediaId");

ALTER TABLE "WorldGalleryImage" ADD CONSTRAINT "WorldGalleryImage_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorldGalleryImage" ADD CONSTRAINT "WorldGalleryImage_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
