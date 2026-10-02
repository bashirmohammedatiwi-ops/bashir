import { Module } from "@nestjs/common";
import { RedisCacheModule } from "../../common/redis-cache.module";
import { CatalogModule } from "../catalog/catalog.module";
import { AssistantCatalogService } from "./assistant-catalog.service";
import { AssistantGuidesController } from "./assistant-guides.controller";
import { AssistantGuidesService } from "./assistant-guides.service";
import { AssistantInsightsController } from "./assistant-insights.controller";
import { AssistantInsightsService } from "./assistant-insights.service";
import { AssistantProfileService } from "./assistant-profile.service";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { LiveVoiceService } from "./live-voice.service";
import { OpenAiAssistantClient } from "./openai-assistant.client";

@Module({
  imports: [CatalogModule, RedisCacheModule],
  controllers: [AssistantController, AssistantGuidesController, AssistantInsightsController],
  providers: [
    AssistantService,
    AssistantCatalogService,
    AssistantGuidesService,
    AssistantInsightsService,
    AssistantProfileService,
    OpenAiAssistantClient,
    LiveVoiceService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
