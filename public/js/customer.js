
// フォームURL生成機能
function showFormURLModal() {
    const modal = document.createElement('div');
    modal.id = 'formURLModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;

    const agentName = 'デモエージェント'; // 実際はログイン情報から取得
    const agentId = 'demo-agent';
    const formURL = `${window.location.origin}/customer-form.html?agent=${agentId}&name=${encodeURIComponent(agentName)}`;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
        ">
            <h2 style="margin-bottom: 20px; color: #1e293b;">顧客入力フォーム URL</h2>
            
            <p style="color: #64748b; margin-bottom: 20px;">
                このURLを顧客に送信すると、顧客が直接情報を入力できます。<br>
                入力された情報は自動的にあなたの顧客リストに追加されます。
            </p>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">フォームURL</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" 
                           id="formURLInput" 
                           value="${formURL}"
                           readonly
                           style="
                               flex: 1;
                               padding: 12px 16px;
                               border: 2px solid #e2e8f0;
                               border-radius: 8px;
                               background: #f8fafc;
                               font-family: monospace;
                               font-size: 14px;
                           ">
                    <button onclick="copyFormURL()" style="
                        padding: 12px 20px;
                        background: #1e3a8a;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">コピー</button>
                </div>
            </div>

            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 10px; color: #1e293b;">使用方法</h4>
                <ol style="margin: 0; padding-left: 20px; color: #64748b;">
                    <li>上記URLをコピー</li>
                    <li>メール、LINE、SMSで顧客に送信</li>
                    <li>顧客が情報を入力・送信</li>
                    <li>自動的に顧客管理に追加</li>
                </ol>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeFormURLModal()" style="
                    padding: 10px 20px;
                    border: 2px solid #e2e8f0;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">閉じる</button>
                <a href="${formURL}" target="_blank" style="
                    padding: 10px 20px;
                    background: #22c55e;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                ">プレビュー</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function copyFormURL() {
    const input = document.getElementById('formURLInput');
    input.select();
    document.execCommand('copy');
    
    // コピー完了通知
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'コピー完了！';
    button.style.background = '#22c55e';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#1e3a8a';
    }, 2000);
}

function closeFormURLModal() {
    const modal = document.getElementById('formURLModal');
    if (modal) {
        modal.remove();
    }
}
