import { Module, type Provider } from "@nestjs/common";
import { loadAssistantAiConfig } from "./ai/ai.config";
import { AI_PROVIDER, ASSISTANT_AI_CONFIG } from "./ai/ai-provider.interface";
import { OpenAiProvider } from "./ai/openai.provider";
import { BrandAliasService } from "./text/brand-alias.service";
import { ProductRetrieverService } from "./retrieval/product-retriever.service";
import { SemanticSearchService } from "./retrieval/semantic-search.service";
import { RankingService } from "./retrieval/ranking.service";
import { ProductCardService } from "./retrieval/product-card.service";
import { CatalogSearchService } from "./retrieval/catalog-search.service";
import { ConversationService } from "./conversation/conversation.service";
import { SummarizerService } from "./conversation/summarizer.service";
import { AssistantMemoryService } from "./memory/memory.service";
import { LessonsService } from "./learning/lessons.service";
import { CatalogKnowledgeService } from "./retrieval/catalog-knowledge.service";
import { WelcomeService } from "./welcome/welcome.service";
import { TurnPlannerService } from "./agent/turn-planner.service";
import { GroundingService } from "./agent/grounding.service";
import { ResponseBuilderService } from "./agent/response-builder.service";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { AiUsageService } from "./observability/ai-usage.service";
import { AssistantService } from "./assistant.service";
import { AssistantController } from "./assistant.controller";

const AiConfigProvider: Provider = {
  provide: ASSISTANT_AI_CONFIG,
  useFactory: loadAssistantAiConfig,
};

const AiProviderImpl: Provider = {
  provide: AI_PROVIDER,
  useFactory: (config: { apiKey: string; baseUrl: string; requestTimeoutMs: number }) =>
    new OpenAiProvider(config.apiKey, config.baseUrl, config.requestTimeoutMs),
  inject: [ASSISTANT_AI_CONFIG],
};

@Module({
  imports: [],
  controllers: [AssistantController],
  providers: [
    AiConfigProvider,
    AiProviderImpl,
    BrandAliasService,
    ProductRetrieverService,
    SemanticSearchService,
    RankingService,
    ProductCardService,
    CatalogSearchService,
    ConversationService,
    SummarizerService,
    AssistantMemoryService,
    LessonsService,
    CatalogKnowledgeService,
    WelcomeService,
    TurnPlannerService,
    GroundingService,
    ResponseBuilderService,
    ToolRegistryService,
    AiUsageService,
    AssistantService,
  ],
  exports: [AssistantService, CatalogSearchService],
})
export class AssistantModule {}
