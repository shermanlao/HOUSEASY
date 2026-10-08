# RentalEasy 租務易

租務文件管理系統，支援多業主物業、租單及收據生成。

## 功能

- **用戶管理**：管理員可新增及管理全部用戶。業主登入後可開啟「用戶管理」，列表只有自己，並可編輯自己的電郵、姓名與密碼
- **物業管理**：建立物業、指派多位業主；可編輯物業資料。管理員的物業列表顯示每個物業所屬業主
- **房間管理**：物業底下的可出租單位；月租掛在房間；可編輯房間
- **租客管理**：記錄租客資料（含護照/身份證），掛在房間；可編輯租客
- **租單管理**：建立與編輯租單。收費項目為選填，每項可按度數（上月／今月）或數量（QTY）計費，並可記錄上次繳款
- **收據管理**：記錄與編輯繳款，生成收據
- **文件列印**：租單及收據以中英雙語輸出，格式與範本一致；列印頁可下載 PDF
- **搜尋管理**（僅管理員）：物業搜尋樓盤筆數與手動同步
- **版本管理**（僅管理員）：租務易用 LightX 版本面板的版面（左邊版本，中間 Build / Put up / Restart），不用每次輸入 token
- **網站圖示**：瀏覽器分頁與列印頁使用藍色房屋圖示（`src/app/favicon.ico`、`icon.ico`、`apple-icon.png`）。重新產生：`node scripts/generate-house-icons.js`。houseasy.io 搜尋站（PropertySearching）使用同一組圖示，套在 `/` 底下所有頁面。

## 技術棧

- Next.js 14 (App Router)
- PostgreSQL + Prisma (Neon / 本地)
- bcryptjs（密碼）
- jose（JWT 會話）

---

## 文件索引

見 [docs/markdown_index.md](docs/markdown_index.md)。

## 本地測試

使用 **PostgreSQL**（可用 `docker compose up -d`）。

### 1. 安裝依賴

```bash
npm install
```

> 若專案在網路磁碟（UNC 路徑如 `\\LIGHTX\...`）且 `npm install` 失敗，請複製到本機（如 `C:\projects\RentalEasy`）再執行。詳見 [docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md)。

### 2. 設定 `.env`

複製 `.env.example` 為 `.env`：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rentaleasy?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
```

### 3. 遷移與種子

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4. 啟動

```bash
npm run dev
```

打開 http://localhost:3000，使用 `admin@rentaleasy.local` / `admin123` 登入。

---

## 部署至 Hostinger VPS（houseasy.io）

正式環境：Nginx → PM2 (`127.0.0.1:3001`) → Next.js，資料庫為 VPS 本機 PostgreSQL。  
**不得改動 levolight.com。** 完整步驟見 [docs/DEPLOY-VPS-HOSTINGER.md](docs/DEPLOY-VPS-HOSTINGER.md)。

---

## 部署至 Vercel + Neon

詳見 [docs/DEPLOY-POSTGRESQL.md](docs/DEPLOY-POSTGRESQL.md)。需設定 `DATABASE_URL`、`JWT_SECRET`，部署後執行 `npx prisma migrate deploy` 與 `npx prisma db seed`。

### 預設帳號（種子後）

- 管理員：`admin@rentaleasy.local` / `admin123`
- 業主：`owner@rentaleasy.local` / `owner123`

---

## 指令摘要

```bash
npm run dev        # 開發
npm run build      # 建置（含 prisma generate）
npx prisma migrate deploy  # 正式環境遷移
npx prisma db seed # 種子資料
```
