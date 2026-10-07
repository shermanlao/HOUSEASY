# 物業搜尋控制台

管理員登入租務（`/rental/login`）後，導覽「搜尋管理」進入 `/rental/admin/search`。

樓盤與同步紀錄存在 PropertySearching 的 SQLite，不在租務 PostgreSQL。控制台畫面在租務管理員區；租務伺服器以 `SEARCH_ADMIN_TOKEN` 呼叫搜尋服務。

## 功能

- 售盤、租盤、28Hse、Squarefoot、成交、庫存筆數
- 各來源上次同步時間
- 最近同步紀錄
- 同步 28Hse / Squarefoot / 中原 Open Data，或全部同步

Squarefoot 從目前 VPS 會被 Cloudflare 回 403（資料中心 IP）。28Hse 與中原不受影響；全部同步時會略過 Squarefoot 並顯示警告。

非管理員無法進入。未設定 `SEARCH_ADMIN_TOKEN` 時頁面會顯示錯誤。

## 環境變數

### RentalEasy

```env
SEARCH_ADMIN_TOKEN="shared-secret"
SEARCH_API_URL="http://127.0.0.1:3001"
JWT_SECRET="same-as-search-app"
```

### PropertySearching

```env
SEARCH_ADMIN_TOKEN="shared-secret"
JWT_SECRET="same-as-rental-app"
```

兩邊 `SEARCH_ADMIN_TOKEN` 與 `JWT_SECRET` 必須相同。搜尋站頁首在偵測到管理員 cookie 時，會把「登入」改成連到此控制台的「搜尋管理」。

搜尋服務受保護的 API：

- `GET /api/admin/status` — `Authorization: Bearer <SEARCH_ADMIN_TOKEN>`
- `POST /api/sync` — 同上；JSON `{ "source": "all" | "h28" | "squarefoot" | "centanet" }`
