"use client";

import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  LayoutOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Badge, Button, Dropdown, Segmented, Space, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";

const { Text } = Typography;

export type DeviceSize = "375" | "390" | "414";

type Props = {
  sectionCount: number;
  activeCount: number;
  errorCount: number;
  warnCount: number;
  previewLoading: boolean;
  zoom: number;
  deviceSize: DeviceSize;
  onRefresh: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenTemplates: () => void;
  onOpenJson: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDeviceChange: (size: DeviceSize) => void;
  onSaveAll?: () => void;
  hasUnsaved?: boolean;
};

export function StudioToolbar({
  sectionCount,
  activeCount,
  errorCount,
  warnCount,
  previewLoading,
  zoom,
  deviceSize,
  onRefresh,
  onExport,
  onImport,
  onOpenTemplates,
  onOpenJson,
  onZoomIn,
  onZoomOut,
  onDeviceChange,
}: Props) {
  const importMenu: MenuProps = {
    items: [
      { key: "templates", icon: <LayoutOutlined />, label: "قوالب جاهزة", onClick: onOpenTemplates },
      { type: "divider" },
      { key: "import", icon: <CloudUploadOutlined />, label: "استيراد JSON", onClick: onImport },
      { key: "export", icon: <CloudDownloadOutlined />, label: "تصدير JSON", onClick: onExport },
    ],
  };

  return (
    <header className="hb-studio-toolbar">
      <div className="hb-studio-toolbar-start">
        <div className="hb-studio-brand">
          <span className="hb-studio-logo">🏠</span>
          <div>
            <Text strong className="hb-studio-title">استوديو الصفحة الرئيسية</Text>
            <Text className="hb-studio-sub">WYSIWYG — ما تراه = ما يراه العميل</Text>
          </div>
        </div>
        <div className="hb-studio-metrics">
          <span className="hb-metric">
            <strong>{sectionCount}</strong> قسم
          </span>
          <span className="hb-metric">
            <strong>{activeCount}</strong> نشط
          </span>
          {errorCount > 0 && (
            <Badge count={errorCount} size="small">
              <span className="hb-metric error">
                <WarningOutlined /> أخطاء
              </span>
            </Badge>
          )}
          {warnCount > 0 && errorCount === 0 && (
            <span className="hb-metric warn">
              <WarningOutlined /> {warnCount} تنبيه
            </span>
          )}
        </div>
      </div>

      <div className="hb-studio-toolbar-center">
        <Segmented
          size="small"
          value={deviceSize}
          onChange={(v) => onDeviceChange(v as DeviceSize)}
          options={[
            { label: "375", value: "375" },
            { label: "390", value: "390" },
            { label: "414", value: "414" },
          ]}
        />
        <Space size={4} className="hb-zoom-controls">
          <Tooltip title="تصغير">
            <Button size="small" icon={<MinusOutlined />} onClick={onZoomOut} disabled={zoom <= 0.7} />
          </Tooltip>
          <span className="hb-zoom-label">{Math.round(zoom * 100)}%</span>
          <Tooltip title="تكبير">
            <Button size="small" icon={<PlusOutlined />} onClick={onZoomIn} disabled={zoom >= 1.2} />
          </Tooltip>
        </Space>
      </div>

      <Space wrap className="hb-studio-toolbar-end">
        <Button icon={<ReloadOutlined />} loading={previewLoading} onClick={onRefresh}>
          تحديث
        </Button>
        <Button onClick={onOpenJson}>JSON</Button>
        <Dropdown menu={importMenu} trigger={["click"]}>
          <Button icon={<SaveOutlined />}>قوالب / نسخ</Button>
        </Dropdown>
        <Button type="primary" icon={<LayoutOutlined />} onClick={onOpenTemplates}>
          + قسم / قالب
        </Button>
      </Space>
    </header>
  );
}
