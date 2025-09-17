// RentPipe Pipeline Touch Enhancement v3（長押しメニュー方式）
class TouchPipelineManager {
    constructor(pipelineManager) {
        this.pipelineManager = pipelineManager;
        this.isLongPress = false;
        this.longPressTimer = null;
        this.currentCard = null;
        this.stageMenu = null;
        this.longPressThreshold = 500; // 500ms長押し
        this.init();
    }

    init() {
        console.log('TouchPipelineManager v3 初期化 - 長押しメニュー方式');
        this.addTouchEvents();
        this.createStageMenu();
        this.addMobileOptimizations();
    }

    addTouchEvents() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
        
        // メニュー外タップでメニューを閉じる
        document.addEventListener('click', this.hideStageMenu.bind(this));
    }

    handleTouchStart(e) {
        const card = e.target.closest('.customer-card');
        
        if (card) {
            this.currentCard = card;
            this.isLongPress = false;
            
            // 長押し検出タイマー開始
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.handleLongPress(card, e.touches[0]);
            }, this.longPressThreshold);
            
            // 視覚的フィードバック（軽微）
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'transform 0.1s ease';
        }
    }

    handleTouchMove(e) {
        // タッチ移動時は長押しをキャンセル
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.currentCard) {
            this.currentCard.style.transform = '';
            this.currentCard.style.transition = '';
        }
    }

    handleTouchEnd(e) {
        // 長押しタイマーをクリア
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.currentCard) {
            this.currentCard.style.transform = '';
            this.currentCard.style.transition = '';
            
            // 長押しでなく、メニューも表示されていない場合は詳細表示
            if (!this.isLongPress && !this.stageMenu.classList.contains('show')) {
                const customerId = this.currentCard.dataset.customerId;
                const customer = this.pipelineManager.customers.find(c => c.id === customerId);
                if (customer) {
                    setTimeout(() => {
                        this.pipelineManager.showCustomerDetail(customer);
                    }, 50);
                }
            }
        }
        
        this.currentCard = null;
        this.isLongPress = false;
    }

    handleLongPress(card, touch) {
        console.log('長押し検出');
        
        // ハプティクスフィードバック
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        // カードの視覚的変化
        card.classList.add('long-press');
        
        // メニューを表示
        this.showStageMenu(card, touch);
    }

    createStageMenu() {
        // メニューDOM作成
        this.stageMenu = document.createElement('div');
        this.stageMenu.className = 'stage-menu';
        
        const stages = [
            { key: '初回相談', label: '📞 初回相談', color: '#ef4444' },
            { key: '物件紹介', label: '🏠 物件紹介', color: '#f97316' },
            { key: '内見', label: '👁 内見', color: '#eab308' },
            { key: '申込', label: '📝 申込', color: '#22c55e' },
            { key: '審査', label: '🔍 審査', color: '#3b82f6' },
            { key: '契約', label: '✍️ 契約', color: '#8b5cf6' },
            { key: '完了', label: '✅ 完了', color: '#059669' }
        ];
        
        stages.forEach(stage => {
            const item = document.createElement('div');
            item.className = 'stage-menu-item';
            item.dataset.stage = stage.key;
            item.innerHTML = stage.label;
            item.style.borderLeft = `4px solid ${stage.color}`;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleStageSelect(stage.key);
            });
            
            this.stageMenu.appendChild(item);
        });
        
        // キャンセルボタン
        const cancelItem = document.createElement('div');
        cancelItem.className = 'stage-menu-item';
        cancelItem.innerHTML = '❌ キャンセル';
        cancelItem.style.borderLeft = '4px solid #64748b';
        cancelItem.style.marginTop = '8px';
        cancelItem.style.background = '#f8fafc';
        
        cancelItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideStageMenu();
        });
        
        this.stageMenu.appendChild(cancelItem);
        document.body.appendChild(this.stageMenu);
    }

    showStageMenu(card, touch) {
        const customerId = card.dataset.customerId;
        const customer = this.pipelineManager.customers.find(c => c.id === customerId);
        
        if (!customer) return;
        
        // 現在のステージをハイライト
        this.stageMenu.querySelectorAll('.stage-menu-item').forEach(item => {
            item.classList.remove('current');
            if (item.dataset.stage === customer.pipelineStatus) {
                item.classList.add('current');
            }
        });
        
        // メニュー位置計算
        const menuWidth = 200;
        const menuHeight = 280;
        let left = touch.clientX - menuWidth / 2;
        let top = touch.clientY - menuHeight / 2;
        
        // 画面外にはみ出る場合の調整
        const padding = 20;
        if (left < padding) left = padding;
        if (left + menuWidth > window.innerWidth - padding) {
            left = window.innerWidth - menuWidth - padding;
        }
        if (top < padding) top = padding;
        if (top + menuHeight > window.innerHeight - padding) {
            top = window.innerHeight - menuHeight - padding;
        }
        
        // メニュー表示
        this.stageMenu.style.left = left + 'px';
        this.stageMenu.style.top = top + 'px';
        this.stageMenu.classList.add('show');
        
        // 顧客IDを保存
        this.stageMenu.dataset.customerId = customerId;
        
        console.log(`${customer.name}のステージメニュー表示`);
    }

    hideStageMenu() {
        if (this.stageMenu && this.stageMenu.classList.contains('show')) {
            this.stageMenu.classList.remove('show');
            
            // 長押し状態のカードをリセット
            document.querySelectorAll('.customer-card.long-press').forEach(card => {
                card.classList.remove('long-press');
            });
            
            console.log('ステージメニュー非表示');
        }
    }

    handleStageSelect(newStage) {
        const customerId = this.stageMenu.dataset.customerId;
        const customer = this.pipelineManager.customers.find(c => c.id === customerId);
        
        if (customer && customer.pipelineStatus !== newStage) {
            const oldStage = customer.pipelineStatus;
            
            // ステータス更新
            this.pipelineManager.updateCustomerStatus(customerId, newStage);
            
            // 成功フィードバック
            this.showMoveSuccess(customer.name, oldStage, newStage);
            
            // ハプティクスフィードバック
            if (navigator.vibrate) {
                navigator.vibrate([50, 50, 100]);
            }
            
            console.log(`${customer.name}: ${oldStage} → ${newStage}`);
        }
        
        // メニューを非表示
        this.hideStageMenu();
    }

    showMoveSuccess(customerName, oldStage, newStage) {
        // 成功通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #059669;
            color: white;
            padding: 12px 20px;
            border-radius: 20px;
            z-index: 10001;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
            animation: slideDown 0.3s ease;
        `;
        
        notification.innerHTML = `
            ✅ ${customerName}<br>
            <small style="opacity: 0.9;">${oldStage} → ${newStage}</small>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    addMobileOptimizations() {
        // 従来のドラッグ&ドロップを無効化
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.customer-card')) {
                e.preventDefault();
            }
        });
        
        // 長押しメニューを無効化
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.customer-card')) {
                e.preventDefault();
            }
        });
        
        // ダブルタップ防止
        this.addDoubleTapPrevention();
        
        // プルリフレッシュ（簡易版）
        this.addPullToRefresh();
    }

    addDoubleTapPrevention() {
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    addPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        
        const pipelineBoard = document.querySelector('.pipeline-board');
        
        pipelineBoard.addEventListener('touchstart', (e) => {
            if (e.target.closest('.customer-card')) return; // カード上では無効
            startY = e.touches[0].clientY;
        });
        
        pipelineBoard.addEventListener('touchmove', (e) => {
            if (e.target.closest('.customer-card')) return; // カード上では無効
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 80 && pipelineBoard.scrollTop === 0) {
                isPulling = true;
                pipelineBoard.style.transform = `translateY(${Math.min(diff - 80, 30)}px)`;
                pipelineBoard.style.transition = 'none';
            }
        });
        
        pipelineBoard.addEventListener('touchend', () => {
            if (isPulling) {
                pipelineBoard.style.transform = '';
                pipelineBoard.style.transition = 'transform 0.3s ease';
                
                console.log('プルリフレッシュ実行');
                this.pipelineManager.loadCustomers();
                this.pipelineManager.renderPipeline();
                this.pipelineManager.updateStats();
            }
            isPulling = false;
        });
    }
}

// アニメーション用CSS追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
        }
        to { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
        }
    }
    
    @keyframes slideUp {
        from { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
        }
        to { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
        }
    }
`;
document.head.appendChild(style);

// スマホ検出とTouch機能初期化
function initTouchSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window;
    
    if (isMobile || hasTouch) {
        console.log('タッチデバイス検出 - 長押しメニュー方式で初期化');
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.pipelineManager) {
                    new TouchPipelineManager(window.pipelineManager);
                    console.log('✅ 長押しメニューシステム初期化完了');
                }
            }, 200);
        });
    }
}

// 初期化実行
initTouchSupport();
