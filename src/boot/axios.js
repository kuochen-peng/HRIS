/**
 * Axios HTTP 客戶端設定 (Axios Boot File)
 *
 * 建立兩個 axios 實體以處理不同情境的 API 請求：
 *
 * 1. api（公開請求）：不附加任何認證標頭
 *    用於不需要登入的 API，例如登入端點
 *
 * 2. apiAuth（認證請求）：自動附加 JWT token 標頭
 *    用於所有需要登入才能存取的 API
 *    包含兩個 interceptor（攔截器）：
 *    - request interceptor：在每次請求前自動加上 Authorization 標頭
 *    - response interceptor：當 API 回傳 401 時，自動刷新 token 並重試
 *
 * 為什麼需要兩個實體：
 * 若只有一個，登入 API 也會帶上 token，在 token 失效時觸發重試迴圈。
 * 分開兩個實體讓 refresh 邏輯更清晰，不會干擾公開 API。
 *
 * 自動 token 刷新流程：
 * 1. API 回傳 401 Unauthorized
 * 2. 攔截器自動呼叫 /user/refresh 換取新 token
 * 3. 更新 store 中的 token
 * 4. 用新 token 重試原本失敗的請求
 * 5. 若 refresh 也失敗（token 完全失效），執行登出
 */

import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import serviceUser from 'src/services/user'
import { useUserStore } from 'src/stores/user'

// 公開 API 實體：不帶 token，用於登入等不需要身份的端點
// baseURL 從 .env 的 VITE_API_URL 取得（開發時為 http://localhost:4000）
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// 認證 API 實體：每次請求自動加上 JWT token
const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

/**
 * request interceptor（請求攔截器）：
 * 在每次發出請求前，從 Pinia store 取得最新 token 並加到 Authorization 標頭。
 * 之所以不在建立實體時設定，是因為 token 可能在請求之間更新（刷新後）。
 */
apiAuth.interceptors.request.use((config) => {
  const user = useUserStore()
  config.headers.Authorization = `Bearer ${user.token}`
  return config
})

/**
 * response interceptor（回應攔截器）：
 * 攔截所有失敗的回應，當遇到 401 且不是 refresh 端點本身時，
 * 自動嘗試刷新 token 並重試原本的請求。
 *
 * 為什麼排除 /user/refresh：
 * 若 refresh 本身也回傳 401，不能再嘗試 refresh（會無窮迴圈），
 * 應直接執行登出。
 */
apiAuth.interceptors.response.use(
  // 成功回應直接穿透（不做任何處理）
  (res) => res,
  async (error) => {
    // 只處理 401 Unauthorized，且不是 refresh 端點本身觸發的 401
    if (error.response && error.config.url !== '/user/refresh' && error.response.status === 401) {
      const user = useUserStore()
      try {
        // 呼叫 refresh API 換取新 token
        const { data } = await serviceUser.refresh()

        // 更新 store 中的 token（interceptor 下次請求時會自動取用）
        user.token = data.result.token

        // 更新失敗請求的設定中的 Authorization 標頭，然後重試
        error.config.headers.Authorization = `Bearer ${user.token}`
        return apiAuth(error.config)
      } catch {
        // refresh 失敗（token 完全失效或帳號被停用），強制登出
        user.logout()
      }
    }
    // 其他錯誤（非 401）直接往外拋，讓呼叫方的 catch 處理
    throw error
  },
)

/**
 * Quasar boot 函式：將 axios 實體掛載到 Vue app 的全域屬性
 * 讓 Options API 元件可以用 this.$axios、this.$api、this.$apiAuth 存取
 * Composition API 元件則直接從此檔案 import { api, apiAuth } 使用
 */
export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
  app.config.globalProperties.$apiAuth = apiAuth
})

// 匯出供 Composition API（services 層）直接 import 使用
export { api, apiAuth }
