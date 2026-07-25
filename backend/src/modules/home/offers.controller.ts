import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { isAdminViewRequest } from "../../common/admin-view.util";
import { Public } from "../../common/decorators/public.decorator";
import { HomeService } from "./home.service";

@ApiTags("offers")
@Controller("offers")
export class OffersController {
  constructor(private readonly home: HomeService) {}

  @Public()
  @Get()
  feed(@Req() req: { headers?: Record<string, unknown> }) {
    return this.home.offersFeed({ skipCache: isAdminViewRequest(req) });
  }
}
