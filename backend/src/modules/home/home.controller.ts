import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { HomeService } from "./home.service";

@ApiTags("home")
@Controller("home")
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Public()
  @Get()
  feed() {
    return this.home.feed();
  }
}
