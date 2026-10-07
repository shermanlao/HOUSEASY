# 記錄編輯頁

每一筆業務資料都有獨立編輯頁（用戶改用列表對話框）。收費項目／上次繳款隨租單一併儲存。

| 記錄 | 編輯路徑 | 列表／詳情入口 |
|------|----------|----------------|
| 物業 | `/rental/properties/[id]/edit` | 物業列表、物業詳情 |
| 房間 | `/rental/properties/[id]/rooms/[roomId]/edit` | 房間列表、物業／房間詳情 |
| 租客 | `/rental/tenants/[id]/edit` | 房間詳情租客列 |
| 租單 | `/rental/statements/[id]/edit` | 租單列表、租單詳情 |
| 收據 | `/rental/receipts/[id]/edit` | 收據管理列表 |
| 用戶 | `/rental/admin/users` 編輯對話框 | 管理員用戶列表（點擊列） |

儲存走既有集合 API 的 `PATCH`（`/api/properties`、`/api/rooms`、`/api/tenants`、`/api/statements`、`/api/receipts`）。權限與檢視相同：業主只能改自己物業底下的資料。
