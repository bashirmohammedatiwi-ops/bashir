/** نفس منطق C:\Users\Future of Technology\Desktop\api\server.js */

const OFFER_DATE_ACTIVE = `
      od.Unlimited = 1
      OR (od.from_date IS NULL AND od.to_date IS NULL)
      OR (od.from_date IS NULL AND od.to_date IS NOT NULL AND CAST(GETDATE() AS date) <= od.to_date)
      OR (od.to_date IS NULL AND od.from_date IS NOT NULL AND CAST(GETDATE() AS date) >= od.from_date)
      OR (
        od.from_date IS NOT NULL
        AND od.to_date IS NOT NULL
        AND CAST(GETDATE() AS date) BETWEEN od.from_date AND od.to_date
      )
`;

export const ACTIVE_OFFERS_CTE = `
ActiveOffers AS (
  SELECT
    od.item_id,
    od.discount,
    od.discount_type,
    od.offer_id,
    CONVERT(NVARCHAR(4000), o.name) AS offer_name,
    o.priority,
    ROW_NUMBER() OVER (
      PARTITION BY od.item_id
      ORDER BY o.priority DESC, od.discount DESC, od.offer_id
    ) AS rn
  FROM dbo.offer_details od
  INNER JOIN dbo.offers o ON od.offer_id = o.id
  WHERE o.enabled = 1
    AND od.discount > 0
    AND (${OFFER_DATE_ACTIVE})
)
`;

const TRIM = (col: string) => `LTRIM(RTRIM(COALESCE(${col}, '')))`;

const CLEAN = (col: string) =>
  `REPLACE(REPLACE(REPLACE(REPLACE(${TRIM(col)}, '|', ' '), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ')`;

const POS_TEXT = (col: string) => CLEAN(`CONVERT(NVARCHAR(4000), ${col})`);

export const ARTICLES_SELECT = `
SELECT
  a.Seq AS productCode,
  ${TRIM("a.Num")} AS productNum,
  ${POS_TEXT("a.Name1")} AS name,
  ${TRIM("a.Barcode")} AS barcode,
  CAST(COALESCE(NULLIF(a.SellPr4, 0), 0) AS bigint) AS originalPrice,
  CAST(COALESCE(NULLIF(a.SellPr5, 0), 0) AS bigint) AS storedFinalPrice,
  CAST(COALESCE(a.CurTot1, 0) AS bigint) AS quantity,
  CAST(COALESCE(ao.discount, 0) AS float) AS discountValue,
  CAST(COALESCE(ao.discount_type, 0) AS int) AS discountType,
  ${POS_TEXT("ao.offer_name")} AS offerName
FROM dbo.articles a
LEFT JOIN ActiveOffers ao ON a.Seq = ao.item_id AND ao.rn = 1
WHERE COALESCE(a.SellPr4, 0) > 0
ORDER BY a.Seq
`;

export const ARTICLES_QUERY = `;WITH ${ACTIVE_OFFERS_CTE} ${ARTICLES_SELECT}`;

export const STATS_QUERY = `
SELECT
  (SELECT COUNT(*) FROM dbo.articles) AS totalArticles,
  (SELECT COUNT(*) FROM dbo.articles WHERE COALESCE(SellPr4, 0) > 0) AS totalWithPrice,
  (SELECT COUNT(*) FROM dbo.articles WHERE Barcode IS NOT NULL AND LTRIM(RTRIM(Barcode)) <> '') AS withBarcode,
  (SELECT COUNT(DISTINCT od.item_id)
   FROM dbo.offer_details od
   INNER JOIN dbo.offers o ON od.offer_id = o.id
   INNER JOIN dbo.articles a ON a.Seq = od.item_id
   WHERE o.enabled = 1 AND od.discount > 0
     AND COALESCE(a.SellPr4, 0) > 0
     AND (${OFFER_DATE_ACTIVE})) AS productsOnOffer
`;
