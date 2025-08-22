// RentPipe Pipeline Touch Enhancement
class TouchPipelineManager {
    constructor(pipelineManager) {
        this.pipelineManager = pipelineManager;
        this.isDragging = false;
        this.draggedElement = null;
        this.touchOffset = { x: 0, y: 0 };
        this.lastTouchPosition = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.addTouchEvents();
        this.addMobileOptimizations();
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
            this.isDragging = true;
            this.draggedElement = element;
            
            const rect = element.getBoundingClientRect();
            this.touchOffset = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            
            this.lastTouchPosition = {
                x: touch.clientX,
                y: touch.clientY
            };
            
            // 視覚的フィードバック
            element.classList.add('dragging');
            this.addDragPreview(element, touch);
            
            // スクロールを一時的に無効化
            document.body.style.overflow = 'hidden';
            
            e.preventDefault();
        }
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        const touch = e.touches[0];
        
        // ドラッグプレビューの位置更新
        if (this.dragPreview) {
            this.dragPreview.style.left = (touch.clientX - this.touchOffset.x) + 'px';
            this.dragPreview.style.top = (touch.clientY - this.touchOffset.y) + 'px';
        }
        
        // ドロップ可能エリアのハイライト
        this.updateDropZoneHighlight(touch.clientX, touch.clientY);
        
        this.lastTouchPosition = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        e.preventDefault();
    }

    handleTouchEnd(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        const touch = e.changedTouches[0];
        const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);
        
        if (dropTarget) {
            const customerId = this.draggedElement.dataset.customerId;
            const newStatus = dropTarget.dataset.status;
            
            if (customerId && newStatus) {
                // ステータス更新
                this.pipelineManager.updateCustomerStatus(customerId, newStatus);
                
                // 成功フィードバック
                this.showSuccessFeedback(dropTarget);
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
        this.dragPreview.style.width = element.offsetWidth + 'px';
        this.dragPreview.style.zIndex = '9999';
        this.dragPreview.style.opacity = '0.8';
        this.dragPreview.style.transform = 'rotate(3deg)';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.classList.add('drag-preview');
        
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
        }
    }

    findDropTarget(x, y) {
        const elementBelow = document.elementFromPoint(x, y);
        return elementBelow?.closest('.pipeline-column');
    }

    showSuccessFeedback(target) {
        target.style.backgroundColor = '#dcfce7';
        setTimeout(() => {
            target.style.backgroundColor = '';
        }, 500);
        
        // ハプティクスフィードバック（サポートされている場合）
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    cleanup() {
        this.isDragging = false;
        
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
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
        });
    }

    addMobileOptimizations() {
        // スマホ用の追加最適化
        
        // 長押しメニューを無効化
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.customer-card')) {
                e.preventDefault();
            }
        });
        
        // プルリフレッシュ機能
        this.addPullToRefresh();
        
        // スムーズスクロール
        this.addSmoothScroll();
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
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 50 && pipelineBoard.scrollLeft === 0) {
                isPulling = true;
                pipelineBoard.classList.add('pulling');
            }
        });
        
        pipelineBoard.addEventListener('touchend', () => {
            if (isPulling) {
                this.pipelineManager.loadCustomers();
                this.pipelineManager.renderPipeline();
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
}

// スマホ検出とTouch機能初期化
function initTouchSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window;
    
    if (isMobile || hasTouch) {
        document.addEventListener('DOMContentLoaded', () => {
            // 既存のPipelineManagerが読み込まれた後に初期化
            setTimeout(() => {
                if (window.pipelineManager) {
                    new TouchPipelineManager(window.pipelineManager);
                }
            }, 100);
        });
    }
}

// 初期化実行
initTouchSupport();
