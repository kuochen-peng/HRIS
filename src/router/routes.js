/**
 * 路由定義 (Route Definitions)
 *
 * 定義應用的所有頁面路徑與對應的元件，以及路由守衛用的 meta 資訊。
 *
 * 結構說明：
 * - 所有功能頁面都在根路由（/）下，共用 MainLayout 作為外殼（側邊欄、標頭）
 * - 404 頁面放在最後，用 catchAll 萬用匹配攔截未知路徑
 *
 * meta 欄位說明（由 router/index.js 的 beforeEach 守衛讀取）：
 * - title：頁面標題（顯示在瀏覽器 tab 和 afterEach 設定 document.title）
 * - login: 'no-login-only' → 只有未登入才能進（登入後會被導向 /attendance）
 * - login: 'login-only'   → 只有已登入才能進（未登入會被導向 /）
 * - admin: true           → 只有 admin 才能進（非 admin 會被導向 /）
 *
 * 動態 import（lazy loading）：
 * () => import('pages/xxx.vue') 讓各頁面只在第一次訪問時才載入 JS bundle，
 * 減少初始載入量，加快首屏速度。
 */

const routes = [
  {
    path: '/',
    // MainLayout 提供側邊欄導覽列，所有功能頁面都在這個佈局框架內渲染
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',            // 根路徑（/）
        component: () => import('pages/loginPage.vue'),
        meta: {
          title: '登入',
          login: 'no-login-only', // 已登入者不需要看到登入頁，自動導向出勤頁
        },
      },
      {
        path: 'attendance',  // /attendance
        component: () => import('pages/attendancePage.vue'),
        meta: {
          title: '打卡紀錄',
          login: 'login-only', // 未登入不能查看出勤紀錄
        },
      },
      {
        path: 'leaveRequest', // /leaveRequest
        component: () => import('pages/leaveRequestPage.vue'),
        meta: {
          title: '請假申請',
          login: 'login-only', // 未登入不能查看假單
        },
      },
      {
        path: 'register',    // /register（員工帳號建立，非公開自助註冊）
        component: () => import('pages/registerPage.vue'),
        meta: {
          title: '註冊',
          login: 'login-only',
          admin: true, // 只有 admin 能建立新帳號，防止任意人員自行加入系統
        },
      },
      {
        path: 'member',      // /member（人員管理）
        component: () => import('pages/memberPage.vue'),
        meta: {
          title: '人事管理',
          login: 'login-only',
          admin: true, // 只有 admin 能管理人員資料
        },
      },
    ],
  },

  // 萬用路由（404）：必須放在最後，Vue Router 按順序匹配路由
  // 所有不符合上方路由的路徑都會到這裡
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
