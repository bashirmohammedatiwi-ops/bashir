import { execFile } from "child_process";
import { promisify } from "util";
import type { PosArticleRow } from "./pricing";

const execFileAsync = promisify(execFile);

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

const ARTICLES_QUERY = `SELECT a.Seq, a.Num, a.Name1, a.Barcode, a.SellPr4, a.SellPr5, a.CurTot1, od.discount, od.discount_type, od.offer_name FROM dbo.articles a OUTER APPLY ( SELECT TOP 1 d.discount, d.discount_type, o.name AS offer_name, o.priority FROM dbo.offer_details d INNER JOIN dbo.offers o ON o.id = d.offer_id WHERE d.item_id = a.Seq AND o.enabled = 1 AND o.type = 1 AND d.discount > 0 AND ( d.Unlimited = 1 OR (d.from_date IS NULL AND d.to_date IS NULL) OR (CAST(GETDATE() AS date) BETWEEN d.from_date AND d.to_date) ) ORDER BY o.priority DESC ) od WHERE a.Barcode IS NOT NULL AND LTRIM(RTRIM(a.Barcode)) <> '' ORDER BY a.Seq`;

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

function findSqlCmd(): string {
  const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
  const candidates = [
    `${programFiles}\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE`,
    `${programFiles}\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\SQLCMD.EXE`,
    `${programFiles}\\Microsoft SQL Server\\150\\Tools\\Binn\\SQLCMD.EXE`,
    "sqlcmd",
  ];
  for (const c of candidates) return c;
  return "sqlcmd";
}

function parseSqlCmdOutput(stdout: string): PosArticleRow[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: PosArticleRow[] = [];
  for (const line of lines) {
    if (/^\-+\|/.test(line) || /rows affected/i.test(line)) continue;
    const parts = line.split("|");
    if (parts.length < 10) continue;

    const [
      seq,
      num,
      name1,
      barcode,
      sellPr4,
      sellPr5,
      curTot1,
      discount,
      discountType,
      offerName,
    ] = parts;

    if (!barcode || barcode === "Barcode") continue;

    rows.push({
      Seq: Number(seq),
      Num: sqlValue(num),
      Name1: sqlValue(name1),
      Barcode: sqlValue(barcode),
      SellPr4: Number(sellPr4) || 0,
      SellPr5: Number(sellPr5) || 0,
      CurTot1: Number(curTot1) || 0,
      discount: sqlNumber(discount),
      discount_type: sqlNumber(discountType),
      offer_name: sqlValue(offerName),
    });
  }
  return rows;
}

async function fetchViaSqlCmd(config: SqlServerConfig): Promise<PosArticleRow[]> {
  const sqlcmd = findSqlCmd();
  const useWindowsAuth = !config.user?.trim();
  const args = [
    "-S",
    config.server,
    "-d",
    config.database,
    "-Q",
    ARTICLES_QUERY,
    "-s",
    "|",
    "-y",
    "0",
  ];

  if (useWindowsAuth) {
    args.unshift("-E");
  } else {
    args.unshift("-U", config.user!, "-P", config.password ?? "");
  }

  if (config.options?.trustServerCertificate !== false) {
    args.unshift("-C");
  }

  const { stdout } = await execFileAsync(sqlcmd, args, {
    maxBuffer: 1024 * 1024 * 256,
    windowsHide: true,
    encoding: "utf8",
  });

  return parseSqlCmdOutput(stdout);
}

function buildMssqlConfig(config: SqlServerConfig): import("mssql").config {
  return {
    server: config.server,
    database: config.database,
    user: config.user,
    password: config.password ?? "",
    options: {
      encrypt: config.options?.encrypt ?? false,
      trustServerCertificate: config.options?.trustServerCertificate ?? true,
    },
  };
}

async function fetchViaMssql(config: SqlServerConfig): Promise<PosArticleRow[]> {
  const sql = await import("mssql");
  const pool = await sql.connect(buildMssqlConfig(config));
  try {
    const result = await pool.request().query<PosArticleRow>(ARTICLES_QUERY);
    return result.recordset ?? [];
  } finally {
    await pool.close();
  }
}

export async function fetchArticles(config: SqlServerConfig): Promise<PosArticleRow[]> {
  const useWindowsAuth = !config.user?.trim();

  if (process.platform === "win32" && useWindowsAuth) {
    return fetchViaSqlCmd(config);
  }

  return fetchViaMssql(config);
}

export async function testConnection(config: SqlServerConfig): Promise<number> {
  const rows = await fetchArticles(config);
  return rows.length;
}
