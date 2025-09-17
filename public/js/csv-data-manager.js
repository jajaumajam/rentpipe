// 📊 CSV データマネージャー
console.log('📊 CSVデータマネージャー初期化中...');

window.CSVDataManager = {
    // 顧客データ → CSV変換
    customersToCSV: function(customers) {
        console.log(`📝 ${customers.length}件の顧客データをCSV変換中...`);
        
        // CSVヘッダー定義
        const headers = [
            'id', 'name', 'email', 'phone', 'age', 'occupation',
            'annualIncome', 'pipelineStatus', 'budgetMin', 'budgetMax',
            'areas', 'roomType', 'requirements', 'notes', 'urgency',
            'createdAt', 'updatedAt', 'source'
        ];
        
        // CSVデータ生成
        const csvRows = [headers.join(',')]; // ヘッダー行
        
        customers.forEach(customer => {
            const row = headers.map(header => {
                let value = customer[header] || '';
                
                // 特別な処理
                if (header === 'areas' && Array.isArray(customer.preferences?.areas)) {
                    value = customer.preferences.areas.join(';');
                } else if (header === 'requirements' && Array.isArray(customer.preferences?.requirements)) {
                    value = customer.preferences.requirements.join(';');
                } else if (header === 'budgetMin') {
                    value = customer.preferences?.budgetMin || '';
                } else if (header === 'budgetMax') {
                    value = customer.preferences?.budgetMax || '';
                } else if (header === 'roomType') {
                    value = customer.preferences?.roomType || '';
                }
                
                // CSV形式にエスケープ
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        console.log(`✅ CSV変換完了: ${csvRows.length-1}件`);
        return csvContent;
    },
    
    // CSV → 顧客データ変換
    csvToCustomers: function(csvText) {
        console.log('📖 CSVデータを顧客データに変換中...');
        
        try {
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
            
            const customers = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length !== headers.length) continue;
                
                const customer = {};
                
                headers.forEach((header, index) => {
                    const value = values[index];
                    
                    if (['areas', 'requirements'].includes(header)) {
                        if (!customer.preferences) customer.preferences = {};
                        customer.preferences[header] = value ? value.split(';') : [];
                    } else if (['budgetMin', 'budgetMax', 'roomType'].includes(header)) {
                        if (!customer.preferences) customer.preferences = {};
                        customer.preferences[header] = header.includes('budget') ? Number(value) || 0 : value;
                    } else {
                        customer[header] = header === 'age' || header === 'annualIncome' ? Number(value) || 0 : value;
                    }
                });
                
                customers.push(customer);
            }
            
            console.log(`✅ CSV解析完了: ${customers.length}件`);
            return customers;
            
        } catch (error) {
            console.error('❌ CSV解析エラー:', error);
            return [];
        }
    },
    
    // CSV行解析（カンマ・クォート対応）
    parseCSVLine: function(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // 次の文字をスキップ
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

console.log('✅ CSVデータマネージャー準備完了');
