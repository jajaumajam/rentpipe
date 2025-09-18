# 🏠 RentPipe - Google Drive統合顧客管理システム

## ✨ 概要
不動産エージェント向けのGoogle Drive統合顧客管理システムです。
ローカルストレージとGoogle Driveのハイブリッドデータ管理により、安全で使いやすい顧客管理を実現します。

## 🚀 本番環境
**URL**: https://rentpipe-ab04e.web.app/

## 🎯 主要機能

### 🔐 認証システム
- Google Identity Services直接認証
- 認証状態の自動保存・復旧
- セキュアなセッション管理

### 👥 顧客管理
- 顧客情報のCRUD操作
- パイプライン状況管理
- 検索・フィルター機能

### ☁️ Google Drive統合
- 自動データ同期（LocalStorage ⟷ Google Drive）
- 自動バックアップ作成
- CSVエクスポート機能

### 📱 レスポンシブ対応
- PC・タブレット・スマートフォン対応
- 直感的なユーザーインターフェース

## 🛠️ 技術構成

### フロントエンド
- **HTML5 + CSS3**: セマンティックマークアップ、レスポンシブデザイン
- **Vanilla JavaScript**: ES6+、非同期処理、モジュラー設計
- **Google APIs**: Drive API v3, Identity Services

### インフラ
- **Firebase Hosting**: 高速・安全・スケーラブル
- **Git管理**: バージョン管理・CI/CD

### データ管理
- **ハイブリッドストレージ**: LocalStorage + Google Drive
- **自動同期**: リアルタイムデータ同期
- **データ形式**: JSON（内部）, CSV（エクスポート）

## 📁 ファイル構造
public/
├── index.html                     # ダッシュボード
├── login.html                     # Google認証ログイン
├── customer.html                  # 顧客管理メイン画面
├── customer-form.html             # 顧客登録フォーム
├── pipeline.html                  # パイプライン管理
├── js/
│   ├── google-drive-api-v2.js                    # Google Drive API
│   ├── google-drive-data-manager.js              # データ管理システム
│   └── customer-google-drive-integration.js     # 統合機能
└── css/
└── style.css                  # 統一スタイル

## 🔧 使用方法

1. **アクセス**: https://rentpipe-ab04e.web.app/
2. **Google認証**: Googleアカウントでログイン
3. **顧客管理**: 顧客情報の登録・管理
4. **Google Drive同期**: 自動バックアップ・同期

## 🌟 特徴

- **🔐 セキュリティ**: Google OAuth 2.0認証
- **☁️ クラウド統合**: Google Drive自動同期
- **📱 マルチデバイス**: 全デバイス対応
- **🚀 高パフォーマンス**: 高速読み込み・レスポンス
- **🛡️ データ保護**: 自動バックアップ・復旧

## 📊 システム要件

- **ブラウザ**: Chrome, Safari, Firefox, Edge（最新版）
- **インターネット**: Google Drive同期時に必要
- **Googleアカウント**: 認証・データ同期に必要

## 🎯 対象ユーザー

- 個人不動産エージェント
- 小規模不動産会社
- 賃貸仲介業務従事者

---

**🏠 RentPipe** - シンプル、安全、効率的な顧客管理システム
