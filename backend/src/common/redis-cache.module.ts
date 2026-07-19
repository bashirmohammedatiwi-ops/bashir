import { Global, Module } from "@nestjs/common";
import { HomeFeedCacheService } from "./home-feed-cache.service";
import { RedisCacheService } from "./redis-cache.service";

@Global()
@Module({
  providers: [RedisCacheService, HomeFeedCacheService],
  exports: [RedisCacheService, HomeFeedCacheService],
})
export class RedisCacheModule {}
