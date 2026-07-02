"use client";

import { Typography } from "antd";
import {
  formatIqd,
  orderItemImage,
  orderItemShadeColor,
  orderItemShadeLabel,
  orderItemVariantLabel,
} from "./order-utils";

const { Text } = Typography;

export function OrderItemsList({ items, compact }: { items: any[]; compact?: boolean }) {
  if (!items?.length) {
    return <Text type="secondary">لا توجد منتجات</Text>;
  }

  return (
    <div className={`ord-items${compact ? " compact" : ""}`}>
      {items.map((item) => (
        <OrderItemRow key={item.id} item={item} compact={compact} />
      ))}
    </div>
  );
}

function OrderItemRow({ item, compact }: { item: any; compact?: boolean }) {
  const img = orderItemImage(item);
  const variant = orderItemVariantLabel(item);
  const shade = orderItemShadeLabel(item);
  const shadeColor = orderItemShadeColor(item);

  return (
    <div className="ord-item-row">
      <div
        className="ord-item-img"
        style={{
          background: img
            ? `center/cover url(${img})`
            : "linear-gradient(135deg,#f8fafc,#e2e8f0)",
        }}
      >
        {!img && <span className="ord-item-img-fallback">📦</span>}
      </div>
      <div className="ord-item-body">
        <Text strong className="ord-item-name">
          {item.productName}
        </Text>
        <div className="ord-item-meta">
          {item.productSku && <span>SKU: {item.productSku}</span>}
          {variant && <span>المقاس: {variant}</span>}
          {shade && (
            <span className="ord-item-shade">
              {shadeColor && (
                <span className="ord-shade-dot" style={{ background: shadeColor }} />
              )}
              {shade}
            </span>
          )}
        </div>
        {!compact && item.unitPrice != null && (
          <Text type="secondary" className="ord-item-unit">
            {formatIqd(item.unitPrice)} × {item.quantity}
          </Text>
        )}
      </div>
      <div className="ord-item-side">
        <span className="ord-item-qty">×{item.quantity}</span>
        <Text strong className="ord-item-price">
          {formatIqd(item.totalPrice)}
        </Text>
      </div>
    </div>
  );
}

export function OrderImageStack({ urls, extra }: { urls: string[]; extra?: number }) {
  if (!urls.length) {
    return (
      <div className="ord-img-stack ord-img-stack--empty">
        <span>📦</span>
      </div>
    );
  }

  return (
    <div className="ord-img-stack">
      {urls.slice(0, 4).map((url, i) => (
        <div
          key={`${url}-${i}`}
          className="ord-img-stack-item"
          style={{
            background: `center/cover url(${url})`,
            zIndex: 4 - i,
            marginRight: i > 0 ? -10 : 0,
          }}
        />
      ))}
      {extra != null && extra > 0 && <span className="ord-img-stack-more">+{extra}</span>}
    </div>
  );
}
