"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Col, DatePicker, Row, Space, Statistic, Table, Tabs } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { queries } from "@/lib/queries";

const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  const params = useMemo(
    () => ({
      from: range[0].format("YYYY-MM-DD"),
      to: range[1].format("YYYY-MM-DD"),
    }),
    [range],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["sales-report", params.from, params.to],
    queryFn: () => queries.salesReport(params),
    staleTime: 5 * 60_000,
  });

  const summary = data?.summary ?? {};

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <PageHeader
          title="التقارير المتقدمة"
          subtitle="مبيعات حسب براند، فئة، موظف، وأكثر المنتجات مبيعاً / مرتجعة"
          extra={
            <RangePicker
              value={range}
              onChange={(v) => v && setRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
              allowClear={false}
            />
          }
        />

        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Card loading={isLoading}>
              <Statistic title="عدد الطلبات" value={summary.orderCount ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card loading={isLoading}>
              <Statistic
                title="إجمالي المبيعات"
                value={summary.revenue ?? 0}
                suffix="د.ع"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card loading={isLoading}>
              <Statistic title="قطع مباعة" value={summary.itemsSold ?? 0} />
            </Card>
          </Col>
        </Row>

        <Card loading={isLoading}>
          <Tabs
            destroyInactiveTabPane
            items={[
              {
                key: "brand",
                label: "حسب البراند",
                children: (
                  <Table
                    rowKey="brandId"
                    pagination={false}
                    dataSource={data?.byBrand ?? []}
                    columns={[
                      { title: "البراند", dataIndex: "brandName" },
                      { title: "الكمية", dataIndex: "quantity" },
                      {
                        title: "الإيراد",
                        dataIndex: "revenue",
                        render: (v) => `${v?.toLocaleString()} د.ع`,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "category",
                label: "حسب الفئة",
                children: (
                  <Table
                    rowKey="categoryId"
                    pagination={false}
                    dataSource={data?.byCategory ?? []}
                    columns={[
                      { title: "الفئة", dataIndex: "categoryName" },
                      { title: "الكمية", dataIndex: "quantity" },
                      {
                        title: "الإيراد",
                        dataIndex: "revenue",
                        render: (v) => `${v?.toLocaleString()} د.ع`,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "staff",
                label: "حسب الموظف",
                children: (
                  <Table
                    rowKey="staffId"
                    pagination={false}
                    dataSource={data?.byStaff ?? []}
                    locale={{ emptyText: "لا توجد تحديثات حالة طلبات في هذه الفترة" }}
                    columns={[
                      { title: "الموظف", dataIndex: "name" },
                      { title: "البريد", dataIndex: "email" },
                      { title: "تحديثات الحالة", dataIndex: "updates" },
                      {
                        title: "قيمة الطلبات",
                        dataIndex: "orderTotal",
                        render: (v) => `${v?.toLocaleString()} د.ع`,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "top",
                label: "الأكثر مبيعاً",
                children: (
                  <Table
                    rowKey="productId"
                    pagination={false}
                    dataSource={data?.topSelling ?? []}
                    columns={[
                      { title: "المنتج", dataIndex: "name" },
                      { title: "SKU", dataIndex: "sku" },
                      { title: "الكمية", dataIndex: "quantity" },
                      {
                        title: "الإيراد",
                        dataIndex: "revenue",
                        render: (v) => `${v?.toLocaleString()} د.ع`,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "refund",
                label: "الأكثر مرتجعة",
                children: (
                  <Table
                    rowKey="productId"
                    pagination={false}
                    dataSource={data?.topRefunded ?? []}
                    locale={{ emptyText: "لا توجد مرتجعات في هذه الفترة" }}
                    columns={[
                      { title: "المنتج", dataIndex: "name" },
                      { title: "SKU", dataIndex: "sku" },
                      { title: "الكمية", dataIndex: "quantity" },
                      {
                        title: "القيمة",
                        dataIndex: "revenue",
                        render: (v) => `${v?.toLocaleString()} د.ع`,
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </>
  );
}
