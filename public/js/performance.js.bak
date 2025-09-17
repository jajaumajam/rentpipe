// RentPipe パフォーマンス最適化
console.log('⚡ パフォーマンス最適化システム初期化中...');

window.PerformanceOptimizer = {
    // デバウンス処理（連続実行を防ぐ）
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // スロットル処理（実行頻度を制限）
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 遅延読み込み
    lazyLoad: function(selector, callback) {
        const elements = document.querySelectorAll(selector);
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        callback(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            elements.forEach(el => observer.observe(el));
        } else {
            // フォールバック
            elements.forEach(el => callback(el));
        }
    },
    
    // メモリ管理
    memoryManager: {
        // 不要なイベントリスナーを削除
        cleanupEventListeners: function(element) {
            const clonedElement = element.cloneNode(true);
            element.parentNode.replaceChild(clonedElement, element);
            return clonedElement;
        },
        
        // キャッシュクリア
        clearCache: function() {
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
        },
        
        // メモリ使用量をチェック
        checkMemoryUsage: function() {
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                const percentage = (used / limit) * 100;
                
                console.log(`📊 メモリ使用率: ${percentage.toFixed(1)}%`);
                
                if (percentage > 80) {
                    console.warn('⚠️ メモリ使用率が高くなっています');
                    return false;
                }
            }
            return true;
        }
    },
    
    // パフォーマンス測定
    measure: function(name, func) {
        const startTime = performance.now();
        const result = func();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        
        if (duration > 1000) {
            console.warn(`⚠️ ${name} の処理時間が長すぎます`);
        }
        
        return result;
    },
    
    // バッチ処理（大量データを小分けに処理）
    processBatch: function(items, batchSize, processor, onComplete) {
        let index = 0;
        
        function processBatchChunk() {
            const chunk = items.slice(index, index + batchSize);
            
            if (chunk.length === 0) {
                if (onComplete) onComplete();
                return;
            }
            
            processor(chunk);
            index += batchSize;
            
            // 次のチャンクを非同期で処理
            requestAnimationFrame(processBatchChunk);
        }
        
        processBatchChunk();
    },
    
    // リクエストキャッシュ
    requestCache: {
        cache: new Map(),
        maxAge: 5 * 60 * 1000, // 5分
        
        get: function(key) {
            const cached = this.cache.get(key);
            if (cached) {
                const age = Date.now() - cached.timestamp;
                if (age < this.maxAge) {
                    console.log(`✅ キャッシュヒット: ${key}`);
                    return cached.data;
                }
                this.cache.delete(key);
            }
            return null;
        },
        
        set: function(key, data) {
            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
            
            // キャッシュサイズ制限
            if (this.cache.size > 50) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
        },
        
        clear: function() {
            this.cache.clear();
        }
    },
    
    // ページ最適化
    optimizePage: function() {
        console.log('🔧 ページ最適化を実行中...');
        
        // 画像の遅延読み込み
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.lazyLoad('img[data-src]', (element) => {
                element.src = element.dataset.src;
                element.removeAttribute('data-src');
            });
        });
        
        // スクロールイベントの最適化
        let scrollTimer;
        window.addEventListener('scroll', this.throttle(() => {
            document.body.classList.add('scrolling');
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                document.body.classList.remove('scrolling');
            }, 150);
        }, 100));
        
        // フォーム入力の最適化
        document.querySelectorAll('input[type="search"], input[type="text"]').forEach(input => {
            if (input.id === 'searchInput' || input.classList.contains('search-input')) {
                input.addEventListener('input', this.debounce((e) => {
                    const searchTerm = e.target.value;
                    if (window.searchCustomers) {
                        window.searchCustomers(searchTerm);
                    }
                }, 300));
            }
        });
        
        console.log('✅ ページ最適化完了');
    },
    
    // 初期化時のパフォーマンスチェック
    checkPerformance: function() {
        const metrics = {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            resources: performance.getEntriesByType('resource').length
        };
        
        console.log('📊 パフォーマンスメトリクス:', metrics);
        
        if (metrics.loadTime > 3000) {
            console.warn('⚠️ ページ読み込みが遅い可能性があります');
        }
        
        return metrics;
    }
};

// ページ読み込み完了後に最適化を実行
document.addEventListener('DOMContentLoaded', function() {
    // 少し遅延させて他の初期化処理と競合しないように
    setTimeout(() => {
        PerformanceOptimizer.optimizePage();
        PerformanceOptimizer.checkPerformance();
    }, 100);
});

console.log('✅ パフォーマンス最適化システム準備完了');
