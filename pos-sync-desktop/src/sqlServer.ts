import { execFile } from "child_process";
import { promisify } from "util";
import { ARTICLES_QUERY, STATS_QUERY } from "./articlesQuery";
import type { PosArticleRow } from "./pricing";

const execFileAsync = promisify(execFile);
const COL_SEP = "|";

export type SqlServerConfig = {
  server: string;
  database: string;
  user?: string;
  password?: string;
  options?: {
    encrypt?: boolean;
    trustServerCertificate?: boolean;
  };
};

export type SqlServerStats = {
  totalArticles: number;
  totalWithPrice: number;
  withBarcode: number;
  productsOnOffer: number;
};

function findSqlCmd(): string {
  const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
  const candidates = [
    `${programFiles}\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE`,
    `${programFiles}\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\SQLCMD.EXE`,
    `${programFiles}\\Microsoft SQL Server\\150\\Tools\\Binn\\SQLCMD.EXE`,
    "sqlcmd",
  ];
  const fs = require("fs") as typeof import("fs");
  for (const c of candidates) {
    if (c === "sqlcmd") return c;
    if (fs.existsSync(c)) return c;
  }
  return "sqlcmd";
}

function sqlValue(raw: string | undefined): string | null {
  if (raw == null) return null;
  const v = raw.trim();
  if (!v || v.toUpperCase() === "NULL") return null;
  return v;
}

function sqlNumber(raw: string | undefined): number | null {
  const v = sqlValue(raw);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

import { normalizeBarcode } from "./barcode";

function normalizeRow(raw: Record<string, unknown>): PosArticleRow {
  return {
    productCode: Number(raw.productCode) || 0,
    productNum: raw.productNum != null ? normalizeBarcode(String(raw.productNum)) : null,
    name: raw.name != null ? String(raw.name) : null,
    barcode: raw.barcode != null ? normalizeBarcode(String(raw.barcode)) : null,
    originalPrice: Number(raw.originalPrice) || 0,
    storedFinalPrice: Number(raw.storedFinalPrice) || 0,
    quantity: Number(raw.quantity) || 0,
    discountValue: raw.discountValue != null ? Number(raw.discountValue) : null,
    discountType: raw.discountType != null ? Number(raw.discountType) : null,
    offerName: raw.offerName != null ? String(raw.offerName) : null,
  };
}

function parseTabOutput(stdout: string): PosArticleRow[] {
  const rows: PosArticleRow[] = [];

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /rows affected/i.test(trimmed)) continue;
    if (trimmed.startsWith("productCode") || trimmed.startsWith("---")) continue;

    const parts = trimmed.split(COL_SEP);
    if (parts.length < 10) continue;

    const [
      productCode,
      productNum,
      name,
      barcode,
      originalPrice,
      storedFinalPrice,
      quantity,
      discountValue,
      discountType,
      offerName,
    ] = parts;

    if (!productCode || productCode === "productCode") continue;

    rows.push(
      normalizeRow({
        productCode,
        productNum: sqlValue(productNum),
        name: sqlValue(name),
        barcode: sqlValue(barcode),
        originalPrice,
        storedFinalPrice,
        quantity,
        discountValue: sqlNumber(discountValue),
        discountType: sqlNumber(discountType),
        offerName: sqlValue(offerName),
      }),
    );
  }

  return rows;
}

function parseStatsOutput(stdout: string): SqlServerStats {
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /rows affected/i.test(trimmed)) continue;
    if (/totalArticles/i.test(trimmed)) continue;

    const parts = trimmed.includes(COL_SEP) ? trimmed.split(COL_SEP) : trimmed.split("\t");
    if (parts.length < 4) continue;

    return {
      totalArticles: Number(parts[0]) || 0,
      totalWithPrice: Number(parts[1]) || 0,
      withBarcode: Number(parts[2]) || 0,
      productsOnOffer: Number(parts[3]) || 0,
    };
  }

  return { totalArticles: 0, totalWithPrice: 0, withBarcode: 0, productsOnOffer: 0 };
}

function minifySql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function buildSqlCmdArgs(config: SqlServerConfig, query: string, separator: string): string[] {
  const useWindowsAuth = !config.user?.trim();
  const args = [
    "-S",
    config.server,
    "-d",
    config.database,
    "-Q",
    minifySql(query),
    "-s",
    separator,
    "-h",
    "-1",
    "-W",
  ];

  if (useWindowsAuth) {
    args.unshift("-E");
  } else {
    args.unshift("-U", config.user!, "-P", config.password ?? "");
  }

  if (config.options?.trustServerCertificate !== false) {
    args.unshift("-C");
  }

  args.push("-f", "o:65001");

  return args;
}

async function runSqlCmd(
  config: SqlServerConfig,
  query: string,
  separator = COL_SEP,
): Promise<string> {
  const sqlcmd = findSqlCmd();
  const args = buildSqlCmdArgs(config, query, separator);
  const { stdout } = await execFileAsync(sqlcmd, args, {
    maxBuffer: 1024 * 1024 * 512,
    windowsHide: true,
    encoding: "utf8",
  });
  return stdout;
}

function buildMssqlConfig(config: SqlServerConfig): import("mssql").config {
  const useWindowsAuth = !config.user?.trim();
  return {
    server: config.server,
    database: config.database,
    ...(useWindowsAuth
      ? {}
      : { user: config.user, password: config.password ?? "" }),
    options: {
      encrypt: config.options?.encrypt ?? false,
      trustServerCertificate: config.options?.trustServerCertificate ?? true,
      ...(useWindowsAuth ? { trustedConnection: true } : {}),
    },
  };
}

async function fetchViaMssql(config: SqlServerConfig): Promise<PosArticleRow[]> {
  const sql = await import("mssql");
  const pool = await sql.connect(buildMssqlConfig(config));
  try {
    const result = await pool.request().query<PosArticleRow>(ARTICLES_QUERY);
    return (result.recordset ?? []).map(normalizeRow);
  } finally {
    await pool.close();
  }
}

async function fetchStatsViaMssql(config: SqlServerConfig): Promise<SqlServerStats> {
  const sql = await import("mssql");
  const pool = await sql.connect(buildMssqlConfig(config));
  try {
    const result = await pool.request().query<SqlServerStats>(STATS_QUERY);
    return (
      result.recordset?.[0] ?? {
        totalArticles: 0,
        totalWithPrice: 0,
        withBarcode: 0,
        productsOnOffer: 0,
      }
    );
  } finally {
    await pool.close();
  }
}

export async function fetchArticles(config: SqlServerConfig): Promise<PosArticleRow[]> {
  const useWindowsAuth = !config.user?.trim();

  if (process.platform === "win32" && useWindowsAuth) {
    try {
      return await fetchViaMssql(config);
    } catch {
      /* fallback to sqlcmd */
    }
    const stdout = await runSqlCmd(config, ARTICLES_QUERY);
    return parseTabOutput(stdout);
  }

  return fetchViaMssql(config);
}

export async function fetchStats(config: SqlServerConfig): Promise<SqlServerStats> {
  const useWindowsAuth = !config.user?.trim();

  if (process.platform === "win32" && useWindowsAuth) {
    try {
      return await fetchStatsViaMssql(config);
    } catch {
      /* fallback */
    }
    const stdout = await runSqlCmd(config, STATS_QUERY, "|");
    return parseStatsOutput(stdout);
  }

  return fetchStatsViaMssql(config);
}

export async function testConnection(
  config: SqlServerConfig,
): Promise<{ count: number; stats: SqlServerStats }> {
  const [rows, stats] = await Promise.all([fetchArticles(config), fetchStats(config)]);
  return { count: rows.length, stats };
}
