import { Global, Module } from "@nestjs/common";
import { AppUpdateController } from "./app-update.controller";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Global()
@Module({
  controllers: [SettingsController, AppUpdateController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
