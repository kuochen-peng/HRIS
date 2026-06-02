/**
 * 使用者狀態管理 Store (User Pinia Store)
 *
 * 管理當前登入使用者的所有狀態，是前端的「認證與使用者資料中心」。
 * 整個應用的登入狀態、角色權限、個人資料都從這裡讀取。
 *
 * 為什麼用 Pinia：
 * Pinia 是 Vue 3 官方推薦的狀態管理方案，取代 Vuex。
 * Composition API 風格（defineStore + setup function）讓 TypeScript 推導更好，
 * 並與 Vue 3 的 composable 設計風格一致。
 *
 * 持久化設計：
 * 只持久化 token（存到 localStorage），其他使用者資料不持久化。
 * 原因：token 需要在重整後仍能識別登入狀態，
 * 但使用者資料（姓名、部門等）應每次重整時從後端重新取得（確保資料最新）。
 * 頁面重整後，router 的 beforeEach 偵測到 token 存在但資料空白，
 * 就會自動呼叫 /user/profile 重新取得。
 *
 * 計算屬性（computed）：
 * - isLoggedIn → 判斷 token 是否存在，用於路由守衛與 UI 顯示
 * - isAdmin    → 判斷是否為 admin，用於條件性顯示管理功能
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    // 使用者基本識別資料
    const _id = ref('')          // MongoDB ObjectId，用於 API 請求（如更新個人資料）
    const account = ref('')      // 登入帳號（顯示在 UI 上，也用於判斷資料是否已載入）
    const role = ref('employee') // 角色：admin / manager / employee，預設 employee
    const name = ref('')         // 顯示名稱（中文姓名）
    const token = ref('')        // JWT token，所有 API 請求的身份憑證

    // 員工資料（後端更新後需呼叫 login() 更新）
    const department = ref('')       // 部門
    const email = ref('')            // 信箱
    const onboardDate = ref(null)    // 到職日（Date 物件）

    // 工作時間設定（用於打卡頁面顯示上下班時間）
    const work = ref({})

    // 假期額度（只存補休，其他假別由 useLeaveCalculator 計算）
    const leaveQuota = ref({
      annual: 0,      // 特休（實際由年資計算，這個值不一定準確）
      sick: 0,        // 病假（法規 30 天上限）
      personal: 0,    // 事假（法規 14 天上限）
      compLeave: 0,   // 補休天數（管理者手動調整）
    })

    // 計算屬性：是否已登入（token 不為空字串表示已登入）
    const isLoggedIn = computed(() => token.value.length > 0)

    // 計算屬性：是否為 admin（用於控制人員管理、新增帳號等功能的顯示）
    const isAdmin = computed(() => role.value === 'admin')

    /**
     * 登入後填充使用者資料
     * 接收後端回傳的使用者物件，將各欄位填入 store 的 ref 中
     * 若有 token（登入時）則一起更新；重新取得 profile 時不更新 token
     */
    const login = (data) => {
      _id.value = data._id
      account.value = data.account
      role.value = data.role
      name.value = data.name
      department.value = data.department
      email.value = data.email
      onboardDate.value = data.onboardDate
      work.value = data.work

      // 有些 API（如 profile）不回傳 leaveQuota，用 || 提供預設值
      leaveQuota.value = data.leaveQuota || {
        annual: 0,
        sick: 0,
        personal: 0,
        compLeave: 0,
      }

      // 只在 data 中有 token 時才更新（login API 才有 token，profile API 沒有）
      if (data.token) {
        token.value = data.token
      }
    }

    /**
     * 登出時清空所有狀態
     * 重置所有 ref 到初始值，token 清空後 isLoggedIn 自動變 false
     */
    const logout = () => {
      _id.value = ''
      account.value = ''
      role.value = 'employee'
      token.value = ''
      name.value = ''
      department.value = ''
      email.value = ''
      onboardDate.value = null
      work.value = {}
      leaveQuota.value = {
        annual: 0,
        sick: 0,
        personal: 0,
        compLeave: 0,
      }
    }

    // 匯出所有 store 的狀態與方法，讓元件可以使用
    return {
      _id,
      account,
      role,
      name,
      token,
      department,
      email,
      onboardDate,
      work,
      leaveQuota,
      isLoggedIn,
      isAdmin,
      login,
      logout,
    }
  },
  {
    // 持久化設定：只將 token 存入 localStorage（key 名稱為 'user'）
    // 其他欄位不持久化，重整後重新從後端取得（確保資料最新）
    persist: {
      key: 'user',
      pick: ['token'],
    },
  },
)
