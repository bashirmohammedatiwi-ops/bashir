import assert from "node:assert/strict";
import { Body, Controller, Module, Post, UseGuards } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { checkFotSignature, fotSignature, FotSignatureGuard } from "./fot-signature.guard";

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

const KEY = "test-key-not-a-secret";
const NOW = 1_793_720_000;
const body = Buffer.from('{"items":[{"barcode":"4059729541383","price":8250}]}');
const ts = String(NOW);

@Controller("sync/inventory")
class EchoController {
  @UseGuards(FotSignatureGuard)
  @Post("bulk")
  bulk(@Body() dto: unknown) {
    return { received: dto };
  }
}

@Module({ controllers: [EchoController], providers: [FotSignatureGuard] })
class EchoModule {}

async function main() {
  await test("known vector matches openssl", () => {
    // printf '%s' '1793720000.{body}' | openssl dgst -sha256 -hmac test-key-not-a-secret
    assert.equal(
      fotSignature(KEY, ts, body),
      "sha256=94a086b0b31129ce9f746110f8e96937654b8aea763a869aa58050c91f5b07fd",
    );
  });

  await test("valid signature is accepted", () => {
    const signature = fotSignature(KEY, ts, body);
    assert.equal(checkFotSignature({ key: KEY, timestamp: ts, signature, rawBody: body, nowSec: NOW }), "ok");
  });

  await test("uppercase hex is accepted", () => {
    const signature = fotSignature(KEY, ts, body).replace(/[a-f]/g, (c) => c.toUpperCase()).replace("SHA256", "sha256");
    assert.equal(checkFotSignature({ key: KEY, timestamp: ts, signature, rawBody: body, nowSec: NOW }), "ok");
  });

  await test("one changed byte in the body is rejected", () => {
    const signature = fotSignature(KEY, ts, body);
    const tampered = Buffer.from(body.toString().replace("8250", "1000"));
    assert.equal(checkFotSignature({ key: KEY, timestamp: ts, signature, rawBody: tampered, nowSec: NOW }), "bad");
  });

  await test("wrong key is rejected", () => {
    const signature = fotSignature("other-key", ts, body);
    assert.equal(checkFotSignature({ key: KEY, timestamp: ts, signature, rawBody: body, nowSec: NOW }), "bad");
  });

  await test("timestamp 301 s away is stale, 300 s is fine", () => {
    const old = String(NOW - 301);
    assert.equal(
      checkFotSignature({ key: KEY, timestamp: old, signature: fotSignature(KEY, old, body), rawBody: body, nowSec: NOW }),
      "stale",
    );
    const edge = String(NOW + 300);
    assert.equal(
      checkFotSignature({ key: KEY, timestamp: edge, signature: fotSignature(KEY, edge, body), rawBody: body, nowSec: NOW }),
      "ok",
    );
  });

  await test("missing headers and non-numeric timestamp are rejected", () => {
    const signature = fotSignature(KEY, ts, body);
    assert.equal(checkFotSignature({ key: KEY, timestamp: undefined, signature, rawBody: body, nowSec: NOW }), "missing");
    assert.equal(checkFotSignature({ key: KEY, timestamp: ts, signature: undefined, rawBody: body, nowSec: NOW }), "missing");
    assert.equal(checkFotSignature({ key: KEY, timestamp: "12a", signature, rawBody: body, nowSec: NOW }), "bad");
    assert.equal(checkFotSignature({ key: KEY, timestamp: ts, signature: "sha256=00", rawBody: body, nowSec: NOW }), "bad");
  });

  // طلبات حقيقية عبر Nest + Fastify بنفس إعداد main.ts (rawBody: true)
  const app = await NestFactory.create<NestFastifyApplication>(EchoModule, new FastifyAdapter(), {
    rawBody: true,
    logger: false,
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  const inject = (headers: Record<string, string>, payload: Buffer) =>
    app.inject({ method: "POST", url: "/sync/inventory/bulk", headers: { "content-type": "application/json", ...headers }, payload });

  try {
    await test("no key configured → 503 for every request", async () => {
      delete process.env.FOT_STORE_SYNC_KEY;
      const res = await inject({}, body);
      assert.equal(res.statusCode, 503);
    });

    process.env.FOT_STORE_SYNC_KEY = KEY;
    const nowTs = String(Math.floor(Date.now() / 1000));

    await test("HTTP: unsigned request → 401", async () => {
      const res = await inject({}, body);
      assert.equal(res.statusCode, 401);
    });

    await test("HTTP: signed over the raw bytes → 201 and body parsed", async () => {
      // مسافات وترتيب حقول غير قياسي: التوقيع على البايتات كما وصلت، لا على JSON معاد تسلسله
      const raw = Buffer.from('{ "items" : [ {"price":8250, "barcode":"4059729541383"} ] }');
      const res = await inject({ "x-fot-timestamp": nowTs, "x-fot-signature": fotSignature(KEY, nowTs, raw) }, raw);
      assert.equal(res.statusCode, 201, res.body);
      assert.equal(JSON.parse(res.body).received.items[0].price, 8250);
    });

    await test("HTTP: Arabic UTF-8 body verifies", async () => {
      const raw = Buffer.from('{"items":[{"barcode":"1","name":"شامبو منقي 300 مل","offerName":"كاتريس 10%"}]}', "utf8");
      const res = await inject({ "x-fot-timestamp": nowTs, "x-fot-signature": fotSignature(KEY, nowTs, raw) }, raw);
      assert.equal(res.statusCode, 201, res.body);
    });

    await test("HTTP: signature for another body → 401", async () => {
      const res = await inject({ "x-fot-timestamp": nowTs, "x-fot-signature": fotSignature(KEY, nowTs, Buffer.from("{}")) }, body);
      assert.equal(res.statusCode, 401);
    });
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
