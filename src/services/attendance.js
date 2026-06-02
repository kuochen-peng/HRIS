/**
 * 出勤 API 服務層 (Attendance Service)
 *
 * 封裝所有出勤相關的後端 API 請求。
 * 所有端點都需要 JWT token（使用 apiAuth），因為打卡必須知道是哪位員工。
 *
 * 設計原則同 user service：
 * 元件只知道「我要打卡」，不需要知道打的是 POST 還是 PATCH，
 * 路徑集中在這裡管理。
 */

import { apiAuth } from 'boot/axios'

export default {
  // 上班打卡：後端自動判斷遲到/正常/曠職狀態
  checkIn: () => {
    return apiAuth.post('/attendance/checkIn')
  },

  // 取得個人出勤紀錄：用於日曆顯示與出勤表格
  getAttendance: () => {
    return apiAuth.get('/attendance/attendance')
  },

  // 下班打卡：後端自動判斷早退狀態
  checkOut: () => {
    return apiAuth.patch('/attendance/checkOut')
  },
}
