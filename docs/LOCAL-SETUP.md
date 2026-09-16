# 本地開發設定

## 若專案在網路磁碟 (UNC 路徑，如 \\LIGHTX\...)

Windows 在 UNC 路徑下執行 `npm install` 常會出錯（EPERM、路徑解析等）。請改用下列方式之一：

### 方法 A：複製到本機（建議）

```powershell
# 複製專案到本機
xcopy "\\LIGHTX\homes\Sherman\Investment\RentalEasy" "C:\projects\RentalEasy" /E /I

# 切換到本機目錄
cd C:\projects\RentalEasy

# 刪除舊的 node_modules（若有）
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 安裝
npm install
```

### 方法 B：對應成磁碟代號

```powershell
# 將網路路徑對應為 Z:
net use Z: \\LIGHTX\homes\Sherman\Investment

# 切換到專案
cd Z:\RentalEasy

# 安裝
npm install
```

若仍失敗，請使用**方法 A** 複製到本機 `C:\` 底下執行。
