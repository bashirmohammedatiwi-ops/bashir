import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../../common/prisma.service";
import { generateMediaVariants, GenerateVariantsInput } from "./media-variants.helper";

@Processor("media")
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<GenerateVariantsInput>) {
    if (job.name !== "generate-variants") return;

    try {
      await generateMediaVariants(this.prisma, job.data);
    } catch (err: any) {
      this.logger.error(`Failed to generate variants for ${job.data.mediaId}: ${err.message}`);
      throw err;
    }
  }
}
