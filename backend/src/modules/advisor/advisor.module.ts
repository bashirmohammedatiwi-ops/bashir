import { Module } from "@nestjs/common";
import { AdvisorController } from "./advisor.controller";
import { AdvisorService } from "./advisor.service";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  controllers: [AdvisorController, SearchController],
  providers: [AdvisorService, SearchService],
})
export class AdvisorModule {}
