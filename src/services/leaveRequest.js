/**
 * 請假申請 API 服務層 (LeaveRequest Service)
 *
 * 封裝所有請假申請相關的後端 API 請求。
 * 所有端點都需要 JWT token（使用 apiAuth），因為假單與使用者身份綁定。
 *
 * 注意 create 函式接收的是 FormData（非一般 JSON）：
 * 因為請假申請可能包含附件，必須用 multipart/form-data 格式傳送。
 * axios 在接收到 FormData 時會自動設定正確的 Content-Type 標頭。
 */

import { apiAuth } from 'boot/axios'

export default {
  // 建立請假申請（form 為 FormData，可含附件）
  create: (form) => {
    return apiAuth.post('/leaveRequest', form)
  },

  // 取得所有員工的請假申請（manager 或 admin 用，後端有角色驗證）
  getAllLeaveRequest: () => {
    return apiAuth.get('/leaveRequest/all')
  },

  // 取得自己的請假申請（員工查看個人假單歷史）
  getMyLeaveRequest: () => {
    return apiAuth.get('/leaveRequest/my')
  },

  // 更新申請狀態（審核同意/駁回，或撤銷申請）
  // id：申請文件的 MongoDB _id
  // status：新狀態字串（'已同意' / '已駁回' / '已撤銷'）
  // comment：審核意見（可選，駁回時說明原因）
  updateStatus: (id, status, comment) => {
    return apiAuth.patch(`/leaveRequest/${id}`, { status, comment })
  },
}
