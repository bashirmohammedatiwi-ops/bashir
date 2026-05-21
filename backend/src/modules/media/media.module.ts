import { DynamicModule, Module, Provider } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { MediaProcessor } from "./media.processor";

const redisEnabled = process.env.REDIS_DISABLED !== "1";

const queueImports: DynamicModule[] = redisEnabled
  ? [BullModule.registerQueue({ name: "media" }) as DynamicModule]
  : [];

// When Redis is disabled, provide a stub queue so DI resolves.
const mediaQueueStubProvider: Provider | null = redisEnabled
  ? null
  : {
      provide: "BullQueue_media",
      useValue: {
        add: async () => null,
      },
    };

const providers: Provider[] = [MediaService];
if (redisEnabled) providers.push(MediaProcessor);
if (mediaQueueStubProvider) providers.push(mediaQueueStubProvider);

@Module({
  imports: queueImports,
  controllers: [MediaController],
  providers,
  exports: [MediaService],
})
export class MediaModule {}
