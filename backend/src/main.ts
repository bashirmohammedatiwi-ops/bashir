import "reflect-metadata";
import { ValidationPipe, Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as Sentry from "@sentry/node";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import compress from "@fastify/compress";
import fastifyStatic from "@fastify/static";
import * as path from "path";
import { AppModule } from "./modules/app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const sentryDsn = process.env.SENTRY_DSN?.trim();
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    Logger.log("Sentry enabled", "Bootstrap");
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
      bodyLimit: 30 * 1024 * 1024,
    }),
    { bufferLogs: true },
  );

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024 },
  });
  await app.register(compress as any, { encodings: ["gzip", "deflate"] });

  const mediaRoot = path.resolve(process.env.MEDIA_ROOT ?? "./uploads");
  const mediaPrefix = (process.env.MEDIA_PUBLIC_PREFIX ?? "/media").replace(/\/$/, "");
  await app.register(fastifyStatic as any, {
    root: mediaRoot,
    prefix: `${mediaPrefix}/`,
    decorateReply: false,
    setHeaders: (res: { setHeader: (k: string, v: string) => void }) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  });

  const corsOrigins = (process.env.CORS_ORIGIN?.split(",") ?? ["*"]).map((o) => o.trim());
  const allowAllOrigins = corsOrigins.includes("*");
  const isDev = process.env.NODE_ENV !== "production";

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  // TransformInterceptor is registered globally via APP_INTERCEPTOR in AppModule.

  const swagger = new DocumentBuilder()
    .setTitle("Alhayaa API")
    .setDescription("Backend APIs for commerce and admin")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup("api/docs", app, doc);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, "0.0.0.0");
  Logger.log(`API listening on http://0.0.0.0:${port}/api/v1`, "Bootstrap");
}

bootstrap();
