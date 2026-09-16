# 部署時切換至 PostgreSQL

本地用 SQLite，部署至 Vercel + Neon 時需改回 PostgreSQL。照以下步驟操作一次即可。

## 1. 修改 prisma/schema.prisma

將以下內容改回：

```prisma
// datasource
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Property
monthlyRent    Decimal  @db.Decimal(12, 2)

// Billing
qty          Decimal  @db.Decimal(12, 2)
unitRate     Decimal  @db.Decimal(12, 2)
lastReading  Decimal  @db.Decimal(12, 2)
thisReading  Decimal  @db.Decimal(12, 2)

// Renting
openingBalance   Decimal  @db.Decimal(12, 2)
paymentReceived  Decimal  @db.Decimal(12, 2)

// Receipt
amountReceived  Decimal  @db.Decimal(12, 2)
```

## 2. 刪除舊 migration、建立新的

```bash
# 刪除 prisma/migrations 資料夾（SQLite 的 migration）

# 建立 PostgreSQL migration
npx prisma migrate dev --name init_postgresql
```

## 3. 設定 Vercel 環境變數

在 Vercel 專案設定中新增：
- `DATABASE_URL`：Neon 的連線字串
- `JWT_SECRET`：隨機字串

## 4. 部署後執行

```bash
# .env 改為 Neon 連線字串後執行
npx prisma migrate deploy
npx prisma db seed
```
