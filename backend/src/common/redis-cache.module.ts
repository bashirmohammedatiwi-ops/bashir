import { Global, Module } from "@nestjs/common";
import { CmsBilingualService } from "./cms-bilingual.service";
import { HomeFeedCacheService } from "./home-feed-cache.service";
import { RedisCacheService } from "./redis-cache.service";
import { TranslationService } from "./translation.service";

@Global()
@Module({
  providers: [RedisCacheService, HomeFeedCacheService, TranslationService, CmsBilingualService],
  exports: [RedisCacheService, HomeFeedCacheService, TranslationService, CmsBilingualService],
})
export class RedisCacheModule {}
