import { Module } from "@nestjs/common";
import { AdvisorController } from "./advisor.controller";
import { AdvisorService } from "./advisor.service";
import { AdvisorAdminController } from "./advisor-admin.controller";
import { AdvisorAiService } from "./advisor-ai.service";
import { AdvisorTrainingService } from "./advisor-training.service";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  controllers: [AdvisorController, SearchController, AdvisorAdminController],
  providers: [AdvisorService, SearchService, AdvisorAiService, AdvisorTrainingService],
  exports: [AdvisorService],
})
export class AdvisorModule {}
