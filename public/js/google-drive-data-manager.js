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
            const query = `name='${this.config.rentpipeFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const folders = await window.GoogleDriveAPIv2.searchFiles(query);
            
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
            const query = `'${this.rentpipeFolderId}' in parents and name='${this.config.customersFileName}' and trashed=false`;
            const files = await window.GoogleDriveAPIv2.searchFiles(query);
            
            if (files.length > 0) {
                this.customersFileId = files[0].id;
                console.log('✅ 既存顧客データファイル使用:', this.customersFileId);
            } else {
                // 新規作成（空のCSV）
                const csvContent = 'id,name,email,phone,pipelineStatus,createdAt,updatedAt,notes\n';
                const file = await this.createCSVFile(this.config.customersFileName, csvContent);
                this.customersFileId = file.id;
                console.log('✅ 顧客データファイル新規作成:', this.customersFileId);
            }
            
        } catch (error) {
            console.error('❌ 顧客データファイル確保エラー:', error);
            throw error;
        }
    },
    
    // CSVファイル作成
    createCSVFile: async function(fileName, content) {
        try {
            const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
            
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
    
    // LocalStorage → GoogleドライブCSV同期
    syncWithLocalStorage: async function() {
        try {
            if (!this.isReady) {
                throw new Error('Google Drive データ管理システムが準備できていません');
            }
            
            console.log('🔄 LocalStorage → Google Drive 同期開始...');
            
            // LocalStorageから顧客データ取得
            const localCustomers = JSON.parse(localStorage.getItem('rentpipe_customers') || '[]');
            console.log(`📊 LocalStorage顧客データ: ${localCustomers.length}件`);
            
            // CSV形式に変換
            const csvContent = this.convertCustomersToCSV(localCustomers);
            
            // GoogleドライブのCSVファイルを更新
            await this.updateCSVFile(this.customersFileId, csvContent);
            
            console.log(`✅ Google Drive同期完了: ${localCustomers.length}件`);
            return localCustomers;
            
        } catch (error) {
            console.error('❌ Google Drive同期エラー:', error);
            throw error;
        }
    },
    
    // GoogleドライブCSV → LocalStorage同期
    syncFromGoogleDrive: async function() {
        try {
            if (!this.isReady) {
                throw new Error('Google Drive データ管理システムが準備できていません');
            }
            
            console.log('🔄 Google Drive → LocalStorage 同期開始...');
            
            // GoogleドライブからCSVファイルを読み込み
            const csvContent = await this.readCSVFile(this.customersFileId);
            
            // CSV → JSON変換
            const customers = this.convertCSVToCustomers(csvContent);
            
            // LocalStorageに保存
            localStorage.setItem('rentpipe_customers', JSON.stringify(customers));
            
            console.log(`✅ LocalStorage同期完了: ${customers.length}件`);
            return customers;
            
        } catch (error) {
            console.error('❌ LocalStorage同期エラー:', error);
            throw error;
        }
    },
    
    // CSVファイル更新
    updateCSVFile: async function(fileId, content) {
        try {
            const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
            
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
                customer.pipelineStatus || customer.status || '',
                customer.createdAt || '',
                customer.updatedAt || '',
                `"${(customer.notes || '').replace(/"/g, '""')}"`
            ].join(',');
        });
        
        return [headers, ...rows].join('\n');
    },
    
    // CSV → 顧客データ変換
    convertCSVToCustomers: function(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            const customers = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = this.parseCSVLine(line);
                if (values.length < headers.length) continue;
                
                const customer = {};
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    customer[header.trim()] = value.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
                });
                
                // 必須フィールドのチェック
                if (customer.id && customer.name) {
                    customers.push(customer);
                }
            }
            
            return customers;
            
        } catch (error) {
            console.error('❌ CSV変換エラー:', error);
            return [];
        }
    },
    
    // CSV行パース
    parseCSVLine: function(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
};

console.log('✅ Google Drive データ管理システム準備完了');
