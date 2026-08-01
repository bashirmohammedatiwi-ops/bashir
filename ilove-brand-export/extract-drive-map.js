/**
 * Run in Chrome DevTools Console while logged into Google Drive.
 * Open the folder that contains barcode subfolders (or the parent folder).
 *
 * 1. https://drive.google.com/drive/folders/1aL2XkJoBapgOtmOqXVYqvftAB2xxxTiI
 * 2. F12 → Console → paste all → Enter
 * 3. Save drive-map.json to ilove-brand-export/
 * 4. cd backend && npx tsx scripts/link-ilove-drive-excel.ts
 */
(async () => {
  const PARENT_ID = "1aL2XkJoBapgOtmOqXVYqvftAB2xxxTiI";

  async function listChildren(folderId) {
    const out = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        fields: "nextPageToken,files(id,name,mimeType,webViewLink)",
        pageSize: "1000",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      out.push(...(data.files || []));
      pageToken = data.nextPageToken || "";
    } while (pageToken);
    return out;
  }

  function isBarcodeName(name) {
    return /^5060\d{10}$/.test(name) || /^SKU-\d+$/.test(name);
  }

  const map = {};

  async function walk(folderId, depth = 0) {
    const children = await listChildren(folderId);
    for (const item of children) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        if (isBarcodeName(item.name)) {
          const files = await listChildren(item.id);
          const images = files
            .filter((f) => (f.mimeType || "").startsWith("image/"))
            .sort((a, b) => a.name.localeCompare(b.name));
          const main = images[0];
          map[item.name] = {
            folderId: item.id,
            folderUrl: item.webViewLink || `https://drive.google.com/drive/folders/${item.id}`,
            mainImageUrl: main
              ? main.webViewLink || `https://drive.google.com/file/d/${main.id}/view`
              : "",
            mainImageId: main?.id || "",
          };
        } else if (depth < 3) {
          await walk(item.id, depth + 1);
        }
      }
    }
  }

  console.log("Scanning Drive folders...");
  const top = await listChildren(PARENT_ID);
  const imagesFolder = top.find(
    (f) =>
      f.mimeType === "application/vnd.google-apps.folder" &&
      f.name.toLowerCase() === "images",
  );
  const startId = imagesFolder?.id ?? PARENT_ID;
  if (imagesFolder) console.log(`Found images/ subfolder → ${imagesFolder.id}`);
  await walk(startId);

  const count = Object.keys(map).length;
  if (!count) {
    alert("No barcode folders found. Open the images folder on Drive and retry.");
    console.log("Tip: navigate into the images subfolder, copy its ID from URL, replace PARENT_ID.");
    return;
  }

  const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "drive-map.json";
  a.click();
  console.log(`✓ Exported ${count} products → drive-map.json`);
  alert(`تم تصدير ${count} مجلد. احفظ الملف في ilove-brand-export ثم شغّل سكربت الربط.`);
})();
