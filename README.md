# 🏠 RentPipe - Google Drive統合顧客管理システム

## ✅ 完成版機能

### 🔑 認証システム
- **login.html**: Google Identity Services直接認証
- 自動認証状態保存・復旧

### 👥 顧客管理システム  
- **customer.html**: Google Drive同期対応顧客管理
- LocalStorage + Google Driveハイブリッドデータ管理
- CSV自動バックアップ機能

### ☁️ Google Drive統合
- 自動フォルダ作成（RentPipe/customers.csv）
- リアルタイム同期・バックアップ
- データ競合回避システム

## 🚀 デプロイURL
**本番環境**: https://rentpipe-ab04e.web.app/

## 🔧 主要技術
- **認証**: Google Identity Services API直接利用
- **データ**: Google Drive API v3 + LocalStorageハイブリッド
- **UI**: Vanilla JavaScript + レスポンシブCSS
- **デプロイ**: Firebase Hosting

## 📁 重要ファイル
public/
├── login.html                   # Google認証ログイン
├── customer.html                # 顧客管理メイン画面
├── js/
│   ├── google-drive-api-v2.js           # Google Drive API
│   ├── google-drive-data-manager.js     # データ管理システム
│   └── customer-google-drive-integration.js # 統合機能
└── css/style.css               # 統一スタイル

## 🎯 使用方法
1. https://rentpipe-ab04e.web.app/ にアクセス
2. Googleアカウントで認証
3. 顧客管理・Google Drive同期を開始

