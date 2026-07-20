-- SECTION_GROUP: إطار ملون يضم مجموعة أقسام
ALTER TYPE "HomeBlockType" ADD VALUE IF NOT EXISTS 'SECTION_GROUP';

-- MEDIA_GALLERY: صور ثابتة/متحركة بأحجام وأشكال متعددة
ALTER TYPE "HomeBlockType" ADD VALUE IF NOT EXISTS 'MEDIA_GALLERY';
