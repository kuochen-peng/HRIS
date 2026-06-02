/**
 * Vue Router 設定 (Router Configuration)
 *
 * 建立 Vue Router 實體，並設定以下行為：
 * 1. 路由模式選擇（SSR / history / hash）
 * 2. beforeEach 路由守衛：身份驗證與授權控制
 * 3. afterEach hook：更新瀏覽器 tab 標題
 *
 * 為什麼用 defineRouter（Quasar 包裝）：
 * Quasar 的 defineRouter 在 SSR 模式下讓每個請求有獨立的 router 實體，
 * 防止不同使用者的狀態污染（cross-request state pollution）。
 * 在一般 SPA 模式下等同於直接建立 router。
 *
 * beforeEach 守衛邏輯：
 * 1. 若 store 有 token（已登入）但 account 為空（資料未載入），
 *    自動呼叫 /user/profile 取回使用者資料（頁面重整後恢復狀態）
 * 2. 依路由的 meta.login 和 meta.admin 判斷是否允許進入
 *    - 未登入存取 login-only 頁面 → 導向登入頁（/）
 *    - 已登入存取 no-login-only 頁面 → 導向出勤頁（/attendance）
 *    - 非 admin 存取 admin 頁面 → 導向首頁（/）
 */

import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import serviceUser from 'src/services/user'
import { useUserStore } from 'src/stores/user'

export default defineRouter(function (/* { store, ssrContext } */) {
  // 依執行環境選擇路由模式：
  // - SSR：用 MemoryHistory（伺服器端無瀏覽器歷史記錄）
  // - 一般：依 quasar.config.js 的 vueRouterMode 設定選 history 或 hash
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    // 路由切換時自動回到頁面頂部（改善使用體驗）
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.BASE_URL),
  })

  /**
   * 全域路由守衛（beforeEach）
   * 每次路由跳轉前執行，決定是否允許進入目標頁面
   *
   * @param {RouteLocationNormalized} to - 目標路由物件
   * 回傳路徑字串 → 導向該路徑（取消原本的跳轉）
   * 不回傳（undefined）→ 允許進入目標頁面
   */
  Router.beforeEach(async (to) => {
    const user = useUserStore()

    // 若 token 存在但使用者資料未載入（頁面重整後 store 資料消失的情況）
    // 用 account 是否為空字串判斷資料是否已載入
    if (user.isLoggedIn && user.account.length === 0) {
      try {
        // 用現有 token 重新取得使用者資料，填充 store
        const { data } = await serviceUser.profile()
        user.login(data.result)
      } catch (error) {
        // token 失效（過期或被撤銷），強制登出並清空 store
        console.log(error)
        user.logout()
      }
    }

    // 已登入者存取「只有未登入才能進」的頁面（如登入頁）→ 導向出勤頁
    if (to.meta.login === 'no-login-only' && user.isLoggedIn) {
      return '/attendance'
    }
    // 未登入者存取「需要登入」的頁面 → 導向登入頁
    else if (to.meta.login === 'login-only' && !user.isLoggedIn) {
      return '/'
    }
    // 非 admin 存取「需要 admin」的頁面 → 導向首頁
    else if (to.meta.admin && !user.isAdmin) {
      return '/'
    }
  })

  /**
   * 全域路由 hook（afterEach）
   * 每次路由跳轉完成後更新瀏覽器 tab 標題
   * 格式：「出勤管理系統 | 頁面名稱」
   */
  Router.afterEach((to) => {
    document.title = `出勤管理系統 | ${to.meta.title}`
  })

  return Router
})
