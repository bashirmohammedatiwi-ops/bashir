import type { PickSlip } from "./ordersApi";

/** قائمة التجهيز المطبوعة: QR + باركود Code128 لرمز الطلب، الأصناف بالترتيب الوارد، بلا أسعار. */

export type SlipLayout = "thermal" | "a4";

const DELIVERY: Record<string, string> = {
  STANDARD: "توصيل عادي",
  EXPRESS: "توصيل سريع",
  PICKUP: "استلام من المحل",
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(d: string) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  } catch {
    return d;
  }
}

/** المكتبتان تُحمَّلان عند الطباعة فقط (لا تثقلان صفحة الطلبات). */
async function loadLibs() {
  const [qr, bc] = await Promise.all([import("qrcode"), import("jsbarcode")]);
  return { QRCode: qr.default ?? qr, JsBarcode: (bc.default ?? bc) as typeof import("jsbarcode") };
}

type Libs = Awaited<ReturnType<typeof loadLibs>>;

async function qrSvg(libs: Libs, text: string): Promise<string> {
  return libs.QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0 });
}

function barcodeSvg(libs: Libs, text: string): string {
  const JsBarcode = libs.JsBarcode;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, text, {
    format: "CODE128",
    width: 2,
    height: 60,
    margin: 0,
    displayValue: true,
    fontSize: 16,
    textMargin: 2,
    font: "monospace",
  });
  // متجه قابل للتمدد: عرض الحاوية دون تشويه.
  const w = svg.getAttribute("width")?.replace("px", "");
  const h = svg.getAttribute("height")?.replace("px", "");
  if (w && h && !svg.getAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svg.outerHTML;
}

function slipBody(slip: PickSlip, qr: string, barcode: string, layout: SlipLayout): string {
  const place = [slip.governorate, slip.area].filter(Boolean).join(" · ");
  const rows = slip.lines
    .map((l, i) => {
      const meta = [l.brand, l.category].filter(Boolean).join(" · ");
      const tail = l.barcodeTail ? `<span class="tail" dir="ltr">••${esc(l.barcodeTail)}</span>` : "";
      if (layout === "thermal") {
        return `<tr>
          <td class="name"><b>${esc(l.name)}</b>${l.shadeName ? `<div class="shade">${esc(l.shadeName)}</div>` : ""}<div class="meta">${esc(meta)} ${tail}</div></td>
          <td class="qty">${l.quantity}</td>
          <td class="tick"><span class="box"></span></td>
        </tr>`;
      }
      return `<tr>
        <td class="idx">${i + 1}</td>
        <td class="name"><b>${esc(l.name)}</b>${l.shadeName ? `<div class="shade">${esc(l.shadeName)}</div>` : ""}</td>
        <td>${esc(l.brand)}</td>
        <td>${esc(l.category)}</td>
        <td class="tailc">${tail}</td>
        <td class="qty">${l.quantity}</td>
        <td class="tick"><span class="box"></span></td>
      </tr>`;
    })
    .join("");

  const head =
    layout === "thermal"
      ? `<tr><th>الصنف</th><th>الكمية</th><th>✓</th></tr>`
      : `<tr><th>#</th><th>الصنف</th><th>الماركة</th><th>القسم</th><th>الباركود</th><th>الكمية</th><th>✓</th></tr>`;

  const gift = slip.isGift
    ? `<div class="block gift"><b>🎁 طلب هدية</b>${
        slip.giftMessage ? `<div>رسالة البطاقة: «${esc(slip.giftMessage)}»</div>` : "<div>بدون رسالة</div>"
      }<div class="warn">لا تضعي الفاتورة أو الأسعار داخل الطرد</div></div>`
    : "";
  const notes = slip.notes ? `<div class="block notes"><b>ملاحظات الزبونة</b><div>${esc(slip.notes)}</div></div>` : "";

  return `<section class="slip">
    <header class="top">
      <div class="info">
        <div class="title">قائمة التجهيز</div>
        <div class="num" dir="ltr">${esc(slip.orderNumber)}</div>
        <div>${esc(fmtDate(slip.createdAt))}</div>
        ${slip.customerName ? `<div>الزبونة: <b>${esc(slip.customerName)}</b></div>` : ""}
        ${place ? `<div>${esc(place)}</div>` : ""}
        <div class="delivery">${esc(DELIVERY[slip.deliveryOption] ?? slip.deliveryOption ?? "")}</div>
      </div>
      <div class="qr">${qr}</div>
    </header>
    <div class="barcode">${barcode}</div>
    <table>
      <thead>${head}</thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total">مجموع القطع: <b>${slip.totalUnits}</b> · الأسطر: <b>${slip.lines.length}</b></div>
    ${gift}
    ${notes}
    <footer class="sign">
      <div>المجهِّز: ..................</div>
      <div>عدد الطرود: ........</div>
    </footer>
  </section>`;
}

const BASE_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000}
body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;direction:rtl}
.slip{page-break-after:always;break-after:page}
.slip:last-child{page-break-after:auto;break-after:auto}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.title{font-weight:800}
.num{font-weight:800;font-family:monospace;text-align:right}
.delivery{font-weight:700;border:1px solid #000;display:inline-block;padding:0 6px;margin-top:2px}
.qr svg{display:block;width:100%;height:auto}
.barcode{margin:6px 0}
.barcode svg{display:block;width:100%;height:auto}
table{width:100%;border-collapse:collapse}
th,td{border-bottom:1px solid #000;padding:4px 3px;text-align:right;vertical-align:top}
th{border-top:1.5px solid #000;border-bottom:1.5px solid #000}
td.qty,th:nth-last-child(2){text-align:center;font-weight:800}
td.qty{font-size:1.25em}
td.tick{text-align:center;width:22px}
.box{display:inline-block;width:14px;height:14px;border:1.5px solid #000}
.shade{font-size:.9em}
.meta{font-size:.8em;color:#333}
.tail{font-family:monospace}
.total{margin-top:6px}
.block{border:1.5px solid #000;padding:5px;margin-top:6px}
.gift .warn{font-weight:800;margin-top:2px}
.sign{display:flex;justify-content:space-between;margin-top:12px;gap:8px}
@media screen{body{background:#e5e7eb;padding:12px}.slip{background:#fff;margin:0 auto 12px;box-shadow:0 1px 6px rgba(0,0,0,.15)}}
`;

const LAYOUT_CSS: Record<SlipLayout, string> = {
  thermal: `
@page{size:80mm auto;margin:3mm}
body{font-size:12px}
.slip{width:74mm;padding:2mm 0}
.qr{width:26mm;flex-shrink:0}
.num{font-size:15px}
.title{font-size:14px}
@media screen{.slip{padding:3mm}}
`,
  a4: `
@page{size:A4;margin:12mm}
body{font-size:13px}
.slip{width:100%;max-width:186mm}
.qr{width:34mm;flex-shrink:0}
.num{font-size:22px}
.title{font-size:18px}
.barcode{max-width:110mm}
td.idx{width:24px;text-align:center}
@media screen{.slip{width:210mm;max-width:210mm;padding:12mm}}
`,
};

/** مستند HTML كامل جاهز للطباعة (معاينة في iframe ثم print()). */
export async function buildPickSlipsHtml(slips: PickSlip[], layout: SlipLayout): Promise<string> {
  const libs = await loadLibs();
  const bodies = await Promise.all(
    slips.map(async (slip) => {
      const code = slip.code || slip.orderNumber;
      const qr = await qrSvg(libs, code);
      return slipBody(slip, qr, barcodeSvg(libs, code), layout);
    }),
  );
  const title = slips.length === 1 ? `قائمة تجهيز ${slips[0].orderNumber}` : `قوائم تجهيز (${slips.length})`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${BASE_CSS}${LAYOUT_CSS[layout]}</style></head><body>${bodies.join("")}</body></html>`;
}
