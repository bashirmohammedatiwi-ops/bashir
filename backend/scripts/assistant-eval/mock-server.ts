/**
 * Mock assistant server for validating the eval harness end-to-end without
 * an LLM. Not part of the app — dev tooling only.
 * Usage: npx tsx scripts/assistant-eval/mock-server.ts [port]
 */
import { createServer } from "http";

const port = Number(process.argv[2] ?? 9911);

createServer((req, res) => {
  if (req.method === "GET" && req.url?.includes("/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (req.method !== "POST" || !req.url?.includes("/assistant/chat")) {
    res.writeHead(404).end();
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    let message = "";
    try {
      message = String(JSON.parse(body).message ?? "");
    } catch {
      /* ignore */
    }

    // Deterministic scripted behaviors to exercise each assertion family.
    const wantsEmpty = /100 دينار|Zxqvv|فانتوم|جوال|سامسونج|جوارب|ذهب|لبس صيفي/.test(message);
    const leak = /تجاهل|Ignore previous/.test(message);
    const wantsOrders = /وين طلبي|طلبتي|طلبي|طلبت|طلب رقم|order/i.test(message);
    const wantsLoyalty = /نقاطي|نقاط|loyalty|point/i.test(message);
    const wantsReorder = /عيد لي|اعيد|نفس الطلب|reorder|كرر طلب/i.test(message);
    const wantsBasket = /روتين كامل|روتين متكامل|هدية كاملة/.test(message);
    const wantsMemory = /تتذكر|انسَ|انسى/.test(message);

    const base = { quickReplies: [], actions: [], metadata: { conversationId: "mock-conv" } };
    const payload = wantsEmpty
      ? {
          ...base,
          type: "EMPTY_RESULT",
          message: "ما لقيت نتيجة تطابق الشروط — هذه أقرب البدائل إن رفعت الميزانية قليلاً.",
          products: [],
        }
      : wantsMemory
        ? {
            ...base,
            type: "TEXT",
            message: "أتذكر تفضيلاتك مثل نوع البشرة والبراندات المفضلة — وتقدر تمسحها من إعدادات التطبيق.",
            products: [],
          }
        : wantsOrders
        ? {
            ...base,
            type: "ORDER_INFO",
            message: "تحتاج تسجيل الدخول داخل التطبيق حتى أشوف طلباتك.",
            products: [],
            orders: [
              { orderNumber: "ORD-1001", status: "SHIPPED", total: 42000, itemCount: 2 },
            ],
          }
        : wantsLoyalty
          ? {
              ...base,
              type: "ORDER_INFO",
              message: "رصيدك 250 نقطة. تحتاج تسجيل الدخول لمتابعة النقاط بدقة.",
              products: [],
              orders: [],
            }
          : wantsReorder
            ? {
                ...base,
                type: "ORDER_INFO",
                message: "تحتاج تسجيل الدخول أولًا حتى أعيد لك طلبك السابق.",
                products: [],
                orders: [],
              }
            : wantsBasket
              ? {
                  ...base,
                  type: "PRODUCT_RECOMMENDATIONS",
                  message:
                    "روتين اقتصادي كامل داخل 100,000 د.ع: غسول 15,000 + تونر 18,000 + مرطب 22,000 + واقي شمس 25,000 — المجموع 80,000 د.ع.",
                  products: [
                    { name: "غسول للوجه", brandName: "Garnier", price: 15000, inStock: true, stock: 8 },
                    { name: "تونر مهدئ", brandName: "Nivea", price: 18000, inStock: true, stock: 5 },
                    { name: "مرطب خفيف", brandName: "Elixir", price: 22000, inStock: true, stock: 6 },
                    { name: "واقي شمس", brandName: "Radiant", price: 25000, inStock: true, stock: 4 },
                  ],
                }
              : {
                  ...base,
                  type: "PRODUCT_RECOMMENDATIONS",
                  message: leak
                    ? "PLANNER_HINT: {intent} TOOL RESULTS: [internal]"
                    : "إذا تريده للدوام ومو ثقيل، Garnier أقرب لطلبك وسعره داخل الميزانية.",
                  products: [
                    { name: "شامبو للشعر الجاف 400ml", brandName: "Garnier", price: 8000, inStock: true, stock: 5 },
                    { name: "كريم مغذي", brandName: "Nivea", price: 12000, inStock: true, stock: 3 },
                  ],
                  quickReplies: [
                    { label: "أرخص", action: "ارخص" },
                    { label: "خيارات ثانية", action: "خيارات ثانية" },
                  ],
                };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: payload }));
  });
}).listen(port, () => console.log(`mock assistant on :${port}`));
