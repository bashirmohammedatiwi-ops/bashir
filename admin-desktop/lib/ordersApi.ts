import { api } from "./api";

/** طلبات التطبيق: التجهيز بالمسح، قائمة التجهيز، الخط الزمني، وشحن هاي إكسبريس (مسارات /control). */

/** يفكّ غلاف { data } — ويُبقي data: null كما هو (لا شحنة مثلاً) بدل إرجاع الغلاف نفسه. */
const data = <T,>(r: { data: any }) =>
  (r.data !== null && typeof r.data === "object" && !Array.isArray(r.data) && "data" in r.data ? r.data.data : r.data) as T;

export type FulfillmentStage =
  | "NEW"
  | "CONFIRMED"
  | "PICKING"
  | "PICKED"
  | "READY_FOR_PICKUP"
  | "INVOICED"
  | "HANDED_OVER"
  | "OUT_FOR_DELIVERY"
  | "DELIVERY_ISSUE"
  | "DELIVERED"
  | "PARTIALLY_DELIVERED"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED";

export type ControlOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryOption: string;
  total: number;
  itemsCount: number;
  quantity: number;
  createdAt: string;
  customer: string;
  phone: string | null;
  place: string | null;
  fulfillmentStage: FulfillmentStage;
  pickerName: string | null;
  adjusted: boolean;
  thumbs: string[];
};

export type ControlOrdersPage = {
  data: ControlOrderRow[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean };
  counts: Record<string, number>;
};

export type PickLineState = "MATCHED" | "SHORT" | "EXTRA" | "PENDING";
export type PickLineColor = "green" | "red" | "yellow" | "grey";

export type PickLine = {
  id: string;
  kind: "ORDERED" | "EXTRA";
  barcode: string | null;
  name: string;
  shadeName: string | null;
  orderedQty: number;
  pickedQty: number;
  missingQty: number;
  unitPrice: number;
  charge: "PAID" | "FREE";
  reason: string | null;
  substituteForLineId: string | null;
  manualConfirm: boolean;
  state: PickLineState;
  color: PickLineColor;
  label: string;
  thumb: string | null;
};

export type PickMoney = {
  orderedSubtotal: number;
  shortageValue: number;
  extrasValue: number;
  freeExtrasValue: number;
  finalSubtotal: number;
  finalDiscountTotal: number;
  /** الخصم الأصلي − الجديد (موجب = خصم أقل لأن ما وصل أقل). */
  discountRecalc?: number;
  shippingTotal: number;
  giftWrapFee: number;
  loyaltyDiscount: number;
  roundingDiscount: number;
  finalTotal: number;
  codAmount: number;
  refundAmount: number;
  adjustmentTotal: number;
  prepaid: boolean;
  changed: boolean;
  allMissing: boolean;
  needsApproval: boolean;
};

export type PickView = {
  order: {
    id: string;
    orderNumber: string;
    code: string;
    status: string;
    stage: FulfillmentStage;
    paymentMethod: string;
    paymentStatus: string;
    deliveryOption: string;
    isGift: boolean;
    giftMessage: string | null;
    notes: string | null;
    pickerId: string | null;
    pickerName: string | null;
    pickStartedAt: string | null;
    pickedAt: string | null;
    parcelCount: number | null;
    invoiced: boolean;
    total: number;
  };
  lines: PickLine[];
  counts: {
    matched: number;
    short: number;
    pending: number;
    extra: number;
    orderedUnits: number;
    pickedOrderedUnits: number;
    extraUnits: number;
  };
  money: PickMoney;
  canFinish: boolean;
};

export type PickSlip = {
  orderNumber: string;
  code: string;
  createdAt: string;
  customerName: string | null;
  governorate: string | null;
  area: string | null;
  deliveryOption: string;
  isGift: boolean;
  giftMessage: string | null;
  notes: string | null;
  lines: { name: string; shadeName: string | null; quantity: number; brand: string; category: string; barcodeTail: string | null }[];
  totalUnits: number;
};

export type TimelineEvent = {
  id: string;
  type: string;
  label: string;
  actorType: "STAFF" | "CASHIER" | "SYSTEM" | "COURIER" | "CUSTOMER" | string;
  actorName: string | null;
  data: Record<string, unknown> | null;
  at: string;
};

export type ShipmentState = "PENDING" | "CREATING" | "CREATED" | "RETRYING" | "FAILED" | "CANCELLED";

export type ShipmentEvent = {
  id?: string;
  statusId: number | null;
  statusAt: string | null;
  note: string | null;
  proofUrl: string | null;
  source: string;
  receivedAt: string;
  label: string;
};

export type Shipment = {
  id: string;
  state: ShipmentState;
  trackingNumber: string | null;
  statusId: number | null;
  statusName: string | null;
  statusAt: string | null;
  isFinal: boolean;
  isCanceled: boolean;
  codAmount: number;
  shippingCost: number | null;
  returnCost: number | null;
  collectedAmount: number | null;
  driverName: string | null;
  deliveryAttempts: number | null;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  alert: boolean;
  events: ShipmentEvent[];
};

export type ShipmentDecision = "resend" | "approve" | "return";

export type CourierAreas = {
  provinces: { id: number; name: string }[];
  rows: { governorate: string; active: boolean; governanceId: number | null; cityId: number | null; suggested: number | null }[];
};

export type CourierHealth = {
  configured: boolean;
  tokenOk: boolean;
  tokenError: string | null;
  webhookSecretSet: boolean;
  lastPollAt: string | null;
  lastPollError: string | null;
  states: Record<string, number>;
  needsDecision: number;
};

export const ordersApi = {
  list: (params: { stage?: string; status?: string; q?: string; page?: number; limit?: number }) =>
    api.get("/control/orders", { params }).then((r) => r.data as ControlOrdersPage),
  pick: (id: string) => api.get(`/control/orders/${id}/pick`).then(data<PickView>),
  slip: (id: string) => api.get(`/control/orders/${id}/slip`).then(data<PickSlip>),
  timeline: (id: string) => api.get(`/control/orders/${id}/timeline`).then(data<TimelineEvent[]>),

  shipment: (id: string) => api.get(`/control/orders/${id}/shipment`).then(data<Shipment | null>),
  shipmentLabel: (id: string) =>
    api.get(`/control/orders/${id}/shipment/label`, { timeout: 60_000 }).then(data<{ pdfBase64: string }>),
  shipmentRefresh: (id: string) =>
    api.post(`/control/orders/${id}/shipment/refresh`).then(data<Shipment | null>),
  shipmentRetry: (id: string) =>
    api.post(`/control/orders/${id}/shipment/retry`, {}, { timeout: 60_000 }).then(data<Shipment | null>),
  shipmentCancel: (id: string) =>
    api.post(`/control/orders/${id}/shipment/cancel`).then(data<Shipment | null>),
  shipmentDecision: (id: string, decision: ShipmentDecision, note?: string) =>
    api
      .post(`/control/orders/${id}/shipment/decision`, { decision, ...(note ? { note } : {}) })
      .then(data<Shipment | null>),

  courierAreas: () => api.get("/control/couriers/hi-express/areas").then(data<CourierAreas>),
  setCourierArea: (governorate: string, governanceId: number | null) =>
    api.put("/control/couriers/hi-express/areas", { governorate, governanceId }).then(data<CourierAreas>),
  courierHealth: () => api.get("/control/couriers/hi-express/health").then(data<CourierHealth>),
  courierPoll: () =>
    api.post("/control/couriers/hi-express/poll", {}, { timeout: 120_000 }).then(data<CourierHealth>),
};
