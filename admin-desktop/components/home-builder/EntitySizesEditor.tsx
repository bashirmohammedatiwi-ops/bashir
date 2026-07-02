"use client";

import { Empty, Form, Typography } from "antd";
import { CardSizePicker } from "./CardSizePicker";
import { CardSizeContext, CardSizeId } from "./card-sizes";

const { Text } = Typography;

type Entity = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
};

type Props = {
  /** مسار حقل cardSizes في الفورم */
  namePath?: (string | number)[];
  /** معرّفات العناصر المختارة بالترتيب */
  ids: string[];
  /** قائمة الكيانات لعرض الأسماء */
  entities: Entity[];
  context?: CardSizeContext;
  defaultSize?: CardSizeId;
};

function entityLabel(e?: Entity) {
  if (!e) return "—";
  return e.name ?? e.title ?? e.slug ?? e.id;
}

export function EntitySizesEditor({
  namePath = ["payload", "cardSizes"],
  ids,
  entities,
  context = "category",
  defaultSize = "md",
}: Props) {
  if (ids.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="اختر عناصر أولاً لتخصيص حجم كل بطاقة"
      />
    );
  }

  const map = new Map(entities.map((e) => [e.id, e]));

  return (
    <div className="hb-entity-sizes">
      <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 12 }}>
        خصّص حجم كل بطاقة — الترتيب يطابق التطبيق
      </Text>
      {ids.map((id, idx) => {
        const entity = map.get(id);
        return (
          <div key={id} className="hb-entity-size-row">
            <div className="hb-entity-size-meta">
              <span className="hb-entity-size-order">{idx + 1}</span>
              <Text ellipsis className="hb-entity-size-name">
                {entityLabel(entity)}
              </Text>
            </div>
            <Form.Item
              name={[...namePath, id]}
              initialValue={defaultSize}
              style={{ marginBottom: 0, flex: 1 }}
            >
              <CardSizePicker context={context} compact />
            </Form.Item>
          </div>
        );
      })}
    </div>
  );
}
