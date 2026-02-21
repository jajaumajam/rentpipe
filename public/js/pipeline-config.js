/**
 * RentPipe パイプライン設定
 *
 * パイプラインのステータス・カラーなど、複数のページで共通利用する定数を一元管理。
 * customer.html / pipeline.html / customer-form.html などから参照する。
 */

window.PipelineConfig = {

    /**
     * パイプラインステータスの一覧（表示順）
     * この配列を変更すれば、全ページのステータス一覧が自動的に更新される
     */
    STATUSES: [
        '初回相談',
        '物件紹介',
        '内見調整',
        '申込準備',
        '審査中',
        '契約手続き'
    ],

    /**
     * ステータスごとのTailwindカラークラス（pipeline.html / kanban 用）
     */
    STATUS_TAILWIND_COLORS: {
        '初回相談':  { dot: 'bg-blue-400',   header: 'bg-blue-50 border-blue-100',     count: 'bg-blue-500',   border: 'border-l-blue-400'   },
        '物件紹介':  { dot: 'bg-purple-400',  header: 'bg-purple-50 border-purple-100', count: 'bg-purple-500', border: 'border-l-purple-400'  },
        '内見調整':  { dot: 'bg-cyan-400',    header: 'bg-cyan-50 border-cyan-100',     count: 'bg-cyan-500',   border: 'border-l-cyan-400'    },
        '申込準備':  { dot: 'bg-amber-400',   header: 'bg-amber-50 border-amber-100',   count: 'bg-amber-500',  border: 'border-l-amber-400'   },
        '審査中':    { dot: 'bg-orange-400',  header: 'bg-orange-50 border-orange-100', count: 'bg-orange-500', border: 'border-l-orange-400'  },
        '契約手続き': { dot: 'bg-green-400',  header: 'bg-green-50 border-green-100',   count: 'bg-green-500',  border: 'border-l-green-400'   },
    },

    /**
     * ステータスごとの色（customer.html / バッジ表示用）
     */
    STATUS_BADGE_COLORS: {
        '初回相談':  { bg: '#fef3c7', color: '#92400e' },
        '物件紹介':  { bg: '#dbeafe', color: '#3d4e6b' },
        '内見調整':  { bg: '#e0e7ff', color: '#4338ca' },
        '申込準備':  { bg: '#fce7f3', color: '#9d174d' },
        '審査中':    { bg: '#fed7aa', color: '#c2410c' },
        '契約手続き': { bg: '#d1fae5', color: '#065f46' },
        '完了':      { bg: '#d1fae5', color: '#065f46' },  // レガシー互換
    },

    /**
     * デフォルトカラー（未定義ステータス用）
     */
    DEFAULT_TAILWIND_COLORS: {
        dot: 'bg-gray-400', header: 'bg-gray-50 border-gray-100',
        count: 'bg-gray-500', border: 'border-l-gray-400'
    },
    DEFAULT_BADGE_COLORS: { bg: '#f3f4f6', color: '#6b7280' },

    /**
     * TailwindカラーをステータスIDから取得
     * @param {string} status
     * @returns {Object}
     */
    getTailwindColors(status) {
        return this.STATUS_TAILWIND_COLORS[status] || this.DEFAULT_TAILWIND_COLORS;
    },

    /**
     * バッジカラーをステータスIDから取得
     * @param {string} status
     * @returns {Object}
     */
    getBadgeColors(status) {
        return this.STATUS_BADGE_COLORS[status] || this.DEFAULT_BADGE_COLORS;
    },
};

console.log('✅ PipelineConfig loaded');
