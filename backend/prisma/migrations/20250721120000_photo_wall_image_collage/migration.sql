-- PHOTO_WALL: معرض صور متقدم — أشكال ونسب وربط شامل
ALTER TYPE "HomeBlockType" ADD VALUE IF NOT EXISTS 'PHOTO_WALL';

-- IMAGE_COLLAGE: شبكة bento / فسيفساء
ALTER TYPE "HomeBlockType" ADD VALUE IF NOT EXISTS 'IMAGE_COLLAGE';
