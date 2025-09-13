#!/bin/bash

echo "🔍 古いGoogle Forms APIファイルの存在確認"
echo "================================="

# 確認するファイルリスト
files_to_check=(
    "public/js/simple-google-forms.js"
    "public/js/google-forms-api-v2.js"
    "public/js/minimal-google-forms.js"
    "public/js/google-identity-config.js"
    "public/js/integrated-auth-manager-v2.js"
)

found_old_files=false

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "❌ 発見: $file"
        found_old_files=true
    else
        echo "✅ なし: $file"
    fi
done

if [ "$found_old_files" = true ]; then
    echo ""
    echo "🚨 古いファイルが見つかりました！"
    echo "これらのファイルがcustomer.htmlで読み込まれている可能性があります。"
    echo ""
    echo "🔧 解決方法:"
    echo "1. customer-gas-only.html を使用してテスト"
    echo "2. 古いファイルを .disabled 拡張子に変更"
    echo "3. customer.html のスクリプト読み込み部分を確認"
else
    echo ""
    echo "✅ 古いファイルは見つかりませんでした"
fi

echo ""
echo "📋 現在のcustomer.htmlで読み込まれているスクリプト確認:"
if [ -f "public/customer.html" ]; then
    grep -n "script src" public/customer.html || echo "スクリプトタグが見つかりません"
else
    echo "customer.htmlが見つかりません"
fi
