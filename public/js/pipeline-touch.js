// RentPipe Pipeline Touch Enhancement v2（スマホUX最適化版）
class TouchPipelineManager {
    constructor(pipelineManager) {
        this.pipelineManager = pipelineManager;
        this.isDragging = false;
        this.draggedElement = null;
        this.touchOffset = { x: 0, y: 0 };
        this.lastTouchPosition = { x: 0, y: 0 };
        this.dragThreshold = 10; // ドラッグ開始の閾値
        this.init();
    }

    init() {
        console.log('TouchPipelineManager v2 初期化');
        this.addTouchEvents();
        this.addMobileOptimizations();
        this.addSwipeGestures();
    }

    addTouchEvents() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        const element = touch.target.closest('.customer-card');
        
        if (element) {
            this.isDragging = false; // 最初はfalse
            this.draggedElement = element;
            this.initialTouch = { x: touch.clientX, y: touch.clientY };
            
            const rect = element.getBoundingClientRect();
            this.touchOffset = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            
            this.lastTouchPosition = {
                x: touch.clientX,
                y: touch.clientY
            };
            
            // 即座に視覚的フィードバック
            element.style.transform = 'scale(1.02)';
            element.style.transition = 'transform 0.1s ease';
            
            // 少し遅らせてドラッグ準備
            setTimeout(() => {
                if (this.draggedElement === element) {
                    element.classList.add('dragging');
                }
            }, 100);
        }
    }

    handleTouchMove(e) {
        if (!this.draggedElement) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - this.initialTouch.x);
        const deltaY = Math.abs(touch.clientY - this.initialTouch.y);
        
        // 閾値を超えたらドラッグ開始
        if (!this.isDragging && (deltaX > this.dragThreshold || deltaY > this.dragThreshold)) {
            this.isDragging = true;
            this.addDragPreview(this.draggedElement, touch);
            
            // 元のカードを半透明に
            this.draggedElement.style.opacity = '0.3';
            
            // スクロールを無効化
            document.body.style.overflow = 'hidden';
            
            console.log('ドラッグ開始');
        }
        
        if (this.isDragging) {
            // ドラッグプレビューの位置更新
            if (this.dragPreview) {
                this.dragPreview.style.left = (touch.clientX - this.touchOffset.x) + 'px';
                this.dragPreview.style.top = (touch.clientY - this.touchOffset.y) + 'px';
            }
            
            // ドロップ可能エリアのハイライト
            this.updateDropZoneHighlight(touch.clientX, touch.clientY);
            
            e.preventDefault(); // スクロール防止
        }
        
        this.lastTouchPosition = {
            x: touch.clientX,
            y: touch.clientY
        };
    }

    handleTouchEnd(e) {
        if (!this.draggedElement) return;
        
        const touch = e.changedTouches[0];
        
        if (this.isDragging) {
            const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);
            
            if (dropTarget && dropTarget.dataset.status) {
                const customerId = this.draggedElement.dataset.customerId;
                const newStatus = dropTarget.dataset.status;
                
                if (customerId && newStatus) {
                    // ステータス更新
                    this.pipelineManager.updateCustomerStatus(customerId, newStatus);
                    
                    // 成功フィードバック
                    this.showSuccessFeedback(dropTarget);
                    this.showMovementAnimation(this.draggedElement, dropTarget);
                }
            }
        } else {
            // ドラッグしなかった場合は詳細表示（元の動作）
            const customer = this.pipelineManager.customers.find(c => c.id === this.draggedElement.dataset.customerId);
            if (customer) {
                setTimeout(() => {
                    this.pipelineManager.showCustomerDetail(customer);
                }, 50);
            }
        }
        
        // クリーンアップ
        this.cleanup();
    }

    addDragPreview(element, touch) {
        this.dragPreview = element.cloneNode(true);
        this.dragPreview.style.position = 'fixed';
        this.dragPreview.style.left = (touch.clientX - this.touchOffset.x) + 'px';
        this.dragPreview.style.top = (touch.clientY - this.touchOffset.y) + 'px';
        this.dragPreview.style.width = '180px'; // 固定幅でコンパクト
        this.dragPreview.style.zIndex = '9999';
        this.dragPreview.style.opacity = '0.9';
        this.dragPreview.style.transform = 'rotate(3deg) scale(1.05)';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.style.transition = 'none';
        this.dragPreview.classList.add('drag-preview');
        
        // よりクリアな視覚効果
        this.dragPreview.style.border = '2px solid #3b82f6';
        this.dragPreview.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.4)';
        this.dragPreview.style.background = '#eff6ff';
        
        document.body.appendChild(this.dragPreview);
    }

    updateDropZoneHighlight(x, y) {
        // 全てのハイライトを削除
        document.querySelectorAll('.pipeline-column').forEach(col => {
            col.classList.remove('drag-over');
        });
        
        // 現在の位置のドロップゾーンを検出
        const elementBelow = document.elementFromPoint(x, y);
        const dropZone = elementBelow?.closest('.pipeline-column');
        
        if (dropZone) {
            dropZone.classList.add('drag-over');
            
            // 視覚的強化
            dropZone.style.transform = 'scale(1.02)';
            dropZone.style.transition = 'all 0.2s ease';
        }
        
        // 他のカラムの変形をリセット
        document.querySelectorAll('.pipeline-column:not(.drag-over)').forEach(col => {
            col.style.transform = '';
        });
    }

    findDropTarget(x, y) {
        const elementBelow = document.elementFromPoint(x, y);
        return elementBelow?.closest('.pipeline-column');
    }

    showSuccessFeedback(target) {
        // 成功アニメーション
        target.classList.add('success-drop');
        
        setTimeout(() => {
            target.classList.remove('success-drop');
        }, 600);
        
        // ハプティクスフィードバック
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]); // 3回の短い振動
        }
    }

    showMovementAnimation(fromElement, toElement) {
        // 移動アニメーション効果
        const moveIndicator = document.createElement('div');
        moveIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #059669;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10001;
            animation: bounceIn 0.3s ease;
        `;
        moveIndicator.textContent = '移動完了！';
        
        document.body.appendChild(moveIndicator);
        
        setTimeout(() => {
            moveIndicator.style.animation = 'bounceOut 0.3s ease forwards';
            setTimeout(() => moveIndicator.remove(), 300);
        }, 1000);
    }

    cleanup() {
        this.isDragging = false;
        
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement.style.opacity = '';
            this.draggedElement.style.transform = '';
            this.draggedElement.style.transition = '';
            this.draggedElement = null;
        }
        
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }
        
        // スクロールを再有効化
        document.body.style.overflow = '';
        
        // ドロップゾーンハイライトを削除
        document.querySelectorAll('.pipeline-column').forEach(col => {
            col.classList.remove('drag-over');
            col.style.transform = '';
        });
    }

    addMobileOptimizations() {
        // 長押しメニューを無効化
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.customer-card')) {
                e.preventDefault();
            }
        });
        
        // プルリフレッシュ機能を改善
        this.addPullToRefresh();
        
        // スムーズスクロール
        this.addSmoothScroll();
        
        // ダブルタップ防止
        this.addDoubleTapPrevention();
    }

    addSwipeGestures() {
        // クイックスワイプでステージ移動
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.customer-card')) {
                this.swipeStart = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now()
                };
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.swipeStart && e.target.closest('.customer-card') && !this.isDragging) {
                const touch = e.changedTouches[0];
                const deltaX = touch.clientX - this.swipeStart.x;
                const deltaY = Math.abs(touch.clientY - this.swipeStart.y);
                const deltaTime = Date.now() - this.swipeStart.time;
                
                // 素早い左右スワイプを検出
                if (Math.abs(deltaX) > 50 && deltaY < 30 && deltaTime < 300) {
                    const card = e.target.closest('.customer-card');
                    const customerId = card.dataset.customerId;
                    
                    if (customerId) {
                        this.handleQuickSwipe(customerId, deltaX > 0 ? 'right' : 'left');
                    }
                }
            }
            this.swipeStart = null;
        });
    }

    handleQuickSwipe(customerId, direction) {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const customer = this.pipelineManager.customers.find(c => c.id === customerId);
        
        if (customer) {
            const currentIndex = statuses.indexOf(customer.pipelineStatus);
            let newIndex;
            
            if (direction === 'right' && currentIndex < statuses.length - 1) {
                newIndex = currentIndex + 1;
            } else if (direction === 'left' && currentIndex > 0) {
                newIndex = currentIndex - 1;
            }
            
            if (newIndex !== undefined) {
                this.pipelineManager.updateCustomerStatus(customerId, statuses[newIndex]);
                console.log(`クイックスワイプ: ${customer.name} → ${statuses[newIndex]}`);
                
                // フィードバック
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }
        }
    }

    addPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        
        const pipelineBoard = document.querySelector('.pipeline-board');
        
        pipelineBoard.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        pipelineBoard.addEventListener('touchmove', (e) => {
            if (this.isDragging) return; // ドラッグ中は無効
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 60 && pipelineBoard.scrollLeft === 0) {
                isPulling = true;
                pipelineBoard.classList.add('pulling');
            }
        });
        
        pipelineBoard.addEventListener('touchend', () => {
            if (isPulling) {
                console.log('プルリフレッシュ実行');
                this.pipelineManager.loadCustomers();
                this.pipelineManager.renderPipeline();
                this.pipelineManager.updateStats();
                
                setTimeout(() => {
                    pipelineBoard.classList.remove('pulling');
                }, 300);
            }
            isPulling = false;
        });
    }

    addSmoothScroll() {
        const pipelineBoard = document.querySelector('.pipeline-board');
        pipelineBoard.style.scrollBehavior = 'smooth';
        
        // カラムヘッダークリックで中央に配置
        document.querySelectorAll('.column-header').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.closest('.pipeline-column');
                const board = document.querySelector('.pipeline-board');
                const scrollLeft = column.offsetLeft - (board.offsetWidth / 2) + (column.offsetWidth / 2);
                board.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            });
        });
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
}

// アニメーション用CSS追加
const style = document.createElement('style');
style.textContent = `
    @keyframes bounceIn {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes bounceOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    }
`;
document.head.appendChild(style);

// スマホ検出とTouch機能初期化
function initTouchSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window;
    
    if (isMobile || hasTouch) {
        console.log('タッチデバイス検出 - TouchPipelineManager初期化');
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.pipelineManager) {
                    new TouchPipelineManager(window.pipelineManager);
                    console.log('✅ タッチ操作機能初期化完了');
                }
            }, 200);
        });
    }
}

// 初期化実行
initTouchSupport();
