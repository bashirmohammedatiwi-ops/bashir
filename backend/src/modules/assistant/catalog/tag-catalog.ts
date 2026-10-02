import { PrismaService } from "../../../common/prisma.service";
import { AssistantCatalogService } from "../assistant-catalog.service";
import { OpenAiAssistantClient } from "../openai-assistant.client";

/** وسم الكتالوج كله مرة وحدة. بعدها الـ API يوسم الجديد كل ساعة. */
async function main() {
  const prisma = new PrismaService();
  const catalog = new AssistantCatalogService(prisma, new OpenAiAssistantClient());
  const started = Date.now();
  let round = 0;
  for (;;) {
    round += 1;
    const result = await catalog.refresh(400, 4);
    const { tagged, total } = await catalog.coverage();
    console.log(`round ${round}: +${result.tagged}, coverage ${tagged}/${total}, ${Math.round((Date.now() - started) / 1000)}s`);
    if (result.tagged === 0 || result.remaining <= 0) break;
  }
  await prisma.$disconnect();
  console.log("TAGGING_DONE");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
