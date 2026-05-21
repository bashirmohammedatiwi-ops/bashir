import { DynamicModule, Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";
import { PrismaModule } from "../common/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { OrdersModule } from "./orders/orders.module";
import { MediaModule } from "./media/media.module";
import { CmsModule } from "./cms/cms.module";
import { ReportsModule } from "./reports/reports.module";
import { SettingsModule } from "./settings/settings.module";
import { UsersModule } from "./users/users.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { AddressesModule } from "./addresses/addresses.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { HomeModule } from "./home/home.module";

const redisEnabled = process.env.REDIS_DISABLED !== "1";

const conditionalImports: DynamicModule[] = redisEnabled
  ? [
      BullModule.forRoot({
        connection: {
          host: process.env.REDIS_HOST ?? "redis",
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }) as DynamicModule,
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 200),
      },
    ]),
    ...conditionalImports,
    PrismaModule,
    HealthModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    MediaModule,
    CmsModule,
    ReportsModule,
    SettingsModule,
    UsersModule,
    ReviewsModule,
    AddressesModule,
    WishlistModule,
    NotificationsModule,
    LoyaltyModule,
    HomeModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
