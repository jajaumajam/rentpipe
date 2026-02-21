/**
 * アーカイブ管理モジュール
 * 顧客管理画面とパイプライン画面で共通利用
 */

const ArchiveManager = {
    // モーダル状態
    targetCustomerId: null,

    /**
     * 初期化 - モーダルHTMLを動的に追加
     */
    initialize: function() {
        // 既にモーダルが存在する場合はスキップ
        if (document.getElementById('archive-manager-modal')) {
            return;
        }

        // モーダルHTMLを追加
        const modalHTML = `
            <div class="archive-manager-modal-overlay" id="archive-manager-modal">
                <div class="archive-manager-modal-content">
                    <h3 id="archive-manager-title">顧客を失注としてアーカイブ</h3>
                    <p style="color: #6b7280; margin-bottom: 16px;">この顧客を失注としてアーカイブします</p>
                    <div class="archive-manager-reason-input">
                        <label>備考（任意）：エージェントメモに追記されます</label>
                        <textarea id="archive-manager-reason" placeholder="例：他社で契約、条件不一致、連絡途絶など"></textarea>
                    </div>
                    <div class="archive-manager-actions">
                        <button class="archive-manager-btn-cancel" onclick="ArchiveManager.closeModal()">キャンセル</button>
                        <button class="archive-manager-btn-ok" onclick="ArchiveManager.executeArchive()">失注としてアーカイブ</button>
                    </div>
                </div>
            </div>
        `;

        // モーダルスタイルを追加
        const styleHTML = `
            <style id="archive-manager-styles">
                .archive-manager-modal-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    justify-content: center;
                    align-items: center;
                }
                .archive-manager-modal-overlay.active {
                    display: flex;
                }
                .archive-manager-modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 16px;
                    max-width: 420px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                .archive-manager-modal-content h3 {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    color: #1f2937;
                }
                .archive-manager-reason-input {
                    margin-bottom: 20px;
                }
                .archive-manager-reason-input label {
                    display: block;
                    font-size: 13px;
                    color: #6b7280;
                    margin-bottom: 8px;
                }
                .archive-manager-reason-input textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    resize: vertical;
                    min-height: 80px;
                    box-sizing: border-box;
                }
                .archive-manager-reason-input textarea:focus {
                    outline: none;
                    border-color: #5b7fa6;
                }
                .archive-manager-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .archive-manager-btn-cancel {
                    padding: 10px 24px;
                    border: none;
                    background: #f3f4f6;
                    color: #4b5563;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .archive-manager-btn-cancel:hover {
                    background: #e5e7eb;
                }
                .archive-manager-btn-ok {
                    padding: 10px 24px;
                    border: none;
                    background: #ef4444;
                    color: white;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .archive-manager-btn-ok:hover {
                    background: #dc2626;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.head.insertAdjacentHTML('beforeend', styleHTML);

        console.log('✅ ArchiveManager 初期化完了');
    },

    /**
     * アーカイブモーダルを開く
     * @param {string} customerId - 顧客ID
     */
    openModal: function(customerId) {
        // 初期化確認
        this.initialize();

        const customer = window.UnifiedDataManager?.getCustomerById(customerId);
        if (!customer) {
            alert('顧客が見つかりません');
            return;
        }

        this.targetCustomerId = customerId;
        const name = customer.basicInfo?.name || customer.name || '顧客';

        document.getElementById('archive-manager-title').textContent = `${name}さんを失注としてアーカイブ`;
        document.getElementById('archive-manager-reason').value = '';
        document.getElementById('archive-manager-modal').classList.add('active');
    },

    /**
     * モーダルを閉じる
     */
    closeModal: function() {
        const modal = document.getElementById('archive-manager-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.targetCustomerId = null;
    },

    /**
     * アーカイブを実行
     */
    executeArchive: async function() {
        if (!this.targetCustomerId) {
            console.error('ArchiveManager: targetCustomerIdがありません');
            return;
        }

        const customerId = this.targetCustomerId;
        const customer = window.UnifiedDataManager?.getCustomerById(customerId);
        if (!customer) {
            this.closeModal();
            alert('顧客が見つかりません');
            return;
        }

        const name = customer.basicInfo?.name || customer.name || '顧客';
        const reasonText = document.getElementById('archive-manager-reason')?.value?.trim() || '';

        try {
            this.closeModal();

            // ローディング表示（存在する場合）
            if (typeof showLoading === 'function') {
                showLoading('アーカイブ中...');
            }

            // 顧客データを直接更新
            customer.isActive = false;
            customer.archivedAt = new Date().toISOString();
            customer.archiveReason = '失注';
            customer.pipelineStatus = '完了';

            // 備考が入力されていればエージェントメモに追記
            if (reasonText) {
                const currentMemo = customer.agentMemo || '';
                const timestamp = new Date().toLocaleDateString('ja-JP');
                customer.agentMemo = currentMemo + `\n\n【${timestamp} アーカイブ】失注: ${reasonText}`;
            }

            // 顧客データを更新
            const result = await window.UnifiedDataManager.updateCustomer(customer);

            if (!result.success) {
                throw new Error(result.error || 'アーカイブに失敗しました');
            }

            // ローディング非表示
            if (typeof hideLoading === 'function') {
                hideLoading();
            }

            // 画面更新コールバック
            if (typeof displayCustomers === 'function') {
                displayCustomers();
            }
            if (typeof updateStats === 'function') {
                updateStats();
            }
            // パイプライン画面用
            if (window.pipelineManager?.renderPipeline) {
                window.pipelineManager.renderPipeline();
            }

            // 通知
            if (window.PageInitializer?.showNotification) {
                window.PageInitializer.showNotification(`${name}さんを失注としてアーカイブしました`, 'success');
            } else {
                alert(`${name}さんを失注としてアーカイブしました`);
            }

            console.log('✅ アーカイブ完了:', customerId);

        } catch (error) {
            console.error('❌ アーカイブエラー:', error);

            if (typeof hideLoading === 'function') {
                hideLoading();
            }

            if (window.PageInitializer?.showNotification) {
                window.PageInitializer.showNotification('アーカイブに失敗しました: ' + error.message, 'error');
            } else {
                alert('アーカイブに失敗しました: ' + error.message);
            }
        }
    }
};

// グローバルに公開
window.ArchiveManager = ArchiveManager;

console.log('✅ ArchiveManager loaded');
