/**
 * 使用者 API 服務層 (User Service)
 *
 * 封裝所有與使用者相關的後端 API 請求，讓元件只需呼叫函式而不需要知道 API 細節。
 * 這是「服務層（Service Layer）」設計模式，職責是：
 * - 集中管理 API 路徑（改路徑時只需改這裡）
 * - 抽象化 HTTP 請求（元件不需要知道是 GET / POST / PATCH）
 * - 明確區分哪些 API 需要認證（apiAuth）哪些不需要（api）
 *
 * api    → 公開端點（登入不需要 token）
 * apiAuth → 需要 JWT token 的端點（由 axios 攔截器自動加標頭）
 */

import { api, apiAuth } from 'boot/axios'

export default {
  // 新增員工帳號（admin 限定）
  create: (data) => {
    return apiAuth.post('/user', data)
  },

  // 登入（用公開 api，不帶 token）
  login: (data) => {
    return api.post('/user/login', data)
  },

  // 取得個人資料（頁面重整後重新載入使用者資料）
  profile: () => {
    return apiAuth.get('/user/profile')
  },

  // 取得所有員工列表（admin 的人員管理頁面使用）
  getUser: () => {
    return apiAuth.get('/user/getUser')
  },

  // 刷新 JWT token（由 axios interceptor 自動呼叫，元件通常不直接呼叫）
  refresh: () => {
    return apiAuth.patch('/user/refresh')
  },

  // 更新指定員工資料（admin 在人員管理頁面編輯員工資訊）
  updateUser: (id, data) => {
    return apiAuth.patch(`/user/updateUser/${id}`, data)
  },

  // 登出（移除後端 token 清單中的此 token）
  logout: () => {
    return apiAuth.delete('/user/logout')
  },
}
