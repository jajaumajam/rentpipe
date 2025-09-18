// 🗃️ Google Drive データ管理システム
console.log('🗃️ Google Drive データ管理システム初期化中...');

window.GoogleDriveDataManager = {
    // 設定
    config: {
        rentpipeFolderName: 'RentPipe',
        customersFileName: 'customers.csv',
        backupPrefix: 'customers_backup_'
    },
    
    // 状態
    isReady: false,
    rentpipeFolderId: null,
    customersFileId: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Drive データ管理システム初期化...');
            
            // Google Drive API v2 の準備確認
            if (!window.GoogleDriveAPIv2?.isAuthenticated) {
                throw new Error('Google Drive API v2 の認証が必要です');
            }
            
            // RentPipe フォルダの確保
            await this.ensureRentPipeFolder();
            
            // 顧客データファイルの確保
            await this.ensureCustomersFile();
            
            this.isReady = true;
            console.log('✅ Google Drive データ管理システム初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ データ管理システム初期化エラー:', error);
            return false;
        }
    },
    
    // RentPipe フォルダ確保
    ensureRentPipeFolder: async function() {
        console.log('📁 RentPipe フォルダ確保中...');
        
        try {
            // 既存フォルダ検索
            const folders = await window.GoogleDriveAPIv2.searchFolders(this.config.rentpipeFolderName);
            
            if (folders.length > 0) {
                this.rentpipeFolderId = folders[0].id;
                console.log('✅ 既存 RentPipe フォルダ使用:', this.rentpipeFolderId);
            } else {
                // 新規作成
                const folder = await window.GoogleDriveAPIv2.createFolder(this.config.rentpipeFolderName);
                this.rentpipeFolderId = folder.id;
                console.log('✅ RentPipe フォルダ新規作成:', this.rentpipeFolderId);
            }
            
        } catch (error) {
            console.error('❌ RentPipe フォルダ確保エラー:', error);
            throw error;
        }
    },
    
    // 顧客データファイル確保
    ensureCustomersFile: async function() {
        console.log('📄 顧客データファイル確保中...');
        
        try {
            // フォルダ内のファイル検索
            const files = await this.searchFilesInFolder(this.rentpipeFolderId, this.config.customersFileName);
            
            if (files.length > 0) {
                this.customersFileId = files[0].id;
                console.log('✅ 既存顧客データファイル使用:', this.customersFileId);
            } else {
                // 新規作成（空のCSV）
                const csvContent = 'id,name,email,phone,pipelineStatus,createdAt,updatedAt\n';
                const file = await this.createCSVFile(this.config.customersFileName, csvContent);
                this.customersFileId = file.id;
                console.log('✅ 顧客データファイル新規作成:', this.customersFileId);
            }
            
        } catch (error) {
            console.error('❌ 顧客データファイル確保エラー:', error);
            throw error;
        }
    },
    
    // フォルダ内ファイル検索
    searchFilesInFolder: async function(folderId, fileName) {
        try {
            const response = await window.gapi.client.drive.files.list({
                q: `'${folderId}' in parents and name='${fileName}'`,
                fields: 'files(id, name)'
            });
            
            return response.result.files || [];
            
        } catch (error) {
            console.error('❌ フォルダ内ファイル検索エラー:', error);
            throw error;
        }
    },
    
    // CSVファイル作成
    createCSVFile: async function(fileName, content) {
        try {
            const blob = new Blob([content], { type: 'text/csv' });
            
            const metadata = {
                name: fileName,
                parents: [this.rentpipeFolderId]
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.GoogleDriveAPIv2.accessToken}`
                },
                body: form
            });
            
            if (!response.ok) {
                throw new Error(`CSVファイル作成エラー: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ CSVファイル作成エラー:', error);
            throw error;
        }
    },
    
    // 顧客データをGoogle Driveに保存
    saveCustomersToGoogleDrive: async function(customers) {
        if (!this.isReady) {
            throw new Error('データ管理システムが初期化されていません');
        }
        
        try {
            console.log(`💾 顧客データ保存開始: ${customers.length}件`);
            
            // バックアップ作成
            await this.createBackup();
            
            // CSVデータ生成
            const csvContent = this.convertCustomersToCSV(customers);
            
            // Google Driveに保存
            await this.updateCSVFile(this.customersFileId, csvContent);
            
            console.log('✅ 顧客データ保存完了');
            return true;
            
        } catch (error) {
            console.error('❌ 顧客データ保存エラー:', error);
            throw error;
        }
    },
    
    // Google Driveから顧客データを読み込み
    loadCustomersFromGoogleDrive: async function() {
        if (!this.isReady) {
            throw new Error('データ管理システムが初期化されていません');
        }
        
        try {
            console.log('📥 顧客データ読み込み開始...');
            
            // CSVファイル読み込み
            const csvContent = await this.readCSVFile(this.customersFileId);
            
            // CSV → JSON変換
            const customers = this.convertCSVToCustomers(csvContent);
            
            console.log(`✅ 顧客データ読み込み完了: ${customers.length}件`);
            return customers;
            
        } catch (error) {
            console.error('❌ 顧客データ読み込みエラー:', error);
            throw error;
        }
    },
    
    // CSVファイル更新
    updateCSVFile: async function(fileId, content) {
        try {
            const blob = new Blob([content], { type: 'text/csv' });
            
            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${window.GoogleDriveAPIv2.accessToken}`,
                    'Content-Type': 'text/csv'
                },
                body: blob
            });
            
            if (!response.ok) {
                throw new Error(`CSVファイル更新エラー: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ CSVファイル更新エラー:', error);
            throw error;
        }
    },
    
    // CSVファイル読み込み
    readCSVFile: async function(fileId) {
        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${window.GoogleDriveAPIv2.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`CSVファイル読み込みエラー: ${response.status}`);
            }
            
            return await response.text();
            
        } catch (error) {
            console.error('❌ CSVファイル読み込みエラー:', error);
            throw error;
        }
    },
    
    // 顧客データ → CSV変換
    convertCustomersToCSV: function(customers) {
        const headers = 'id,name,email,phone,pipelineStatus,createdAt,updatedAt,notes';
        
        const rows = customers.map(customer => {
            return [
                customer.id || '',
                `"${(customer.name || '').replace(/"/g, '""')}"`,
                customer.email || '',
                customer.phone || '',
                customer.pipelineStatus || '',
                customer.createdAt || '',
                customer.updatedAt || '',
                `"${(customer.notes || '').replace(/"/g, '""')}"`
            ].join(',');
        });
        
        return [headers, ...rows].join('\n');
    },
    
    // CSV → 顧客データ変換
    convertCSVToCustomers: function(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',');
        const customers = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const customer = {};
                headers.forEach((header, index) => {
                    customer[header] = values[index] || '';
                });
                customers.push(customer);
            }
        }
        
        return customers;
    },
    
    // CSV行パース
    parseCSVLine: function(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
            } else if (char === '"' && inQuotes) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    },
    
    // バックアップ作成
    createBackup: async function() {
        try {
            if (!this.customersFileId) return;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const backupName = `${this.config.backupPrefix}${timestamp}.csv`;
            
            // 現在のファイル内容を取得
            const currentContent = await this.readCSVFile(this.customersFileId);
            
            // バックアップファイル作成
            await this.createCSVFile(backupName, currentContent);
            
            console.log(`✅ バックアップ作成完了: ${backupName}`);
            
        } catch (error) {
            console.warn('⚠️ バックアップ作成エラー:', error);
            // バックアップエラーは処理を止めない
        }
    },
    
    // LocalStorageと同期
    syncWithLocalStorage: async function() {
        try {
            console.log('🔄 LocalStorageとの同期開始...');
            
            // LocalStorageから現在の顧客データ取得
            const localCustomers = JSON.parse(localStorage.getItem('rentpipe_customers') || '[]');
            
            if (localCustomers.length > 0) {
                // Google Driveに保存
                await this.saveCustomersToGoogleDrive(localCustomers);
                console.log('✅ LocalStorage → Google Drive 同期完了');
            }
            
            // Google Driveから最新データ取得
            const driveCustomers = await this.loadCustomersFromGoogleDrive();
            
            // LocalStorageを更新
            localStorage.setItem('rentpipe_customers', JSON.stringify(driveCustomers));
            console.log('✅ Google Drive → LocalStorage 同期完了');
            
            return driveCustomers;
            
        } catch (error) {
            console.error('❌ 同期エラー:', error);
            throw error;
        }
    },
    
    // デバッグ情報
    getDebugInfo: function() {
        return {
            isReady: this.isReady,
            rentpipeFolderId: this.rentpipeFolderId,
            customersFileId: this.customersFileId,
            config: this.config
        };
    }
};

console.log('✅ Google Drive データ管理システム準備完了');
