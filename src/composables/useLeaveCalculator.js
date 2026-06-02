/**
 * 特休計算 Composable (useLeaveCalculator)
 *
 * 提供依據台灣勞動基準法計算員工法定特休天數的函式。
 * 採用 Composition API 的 composable 模式封裝，讓多個元件共用此計算邏輯。
 *
 * 為什麼在前端計算而非後端：
 * 特休天數根據到職日與今日日期動態計算，會隨時間改變。
 * 放在前端可以即時反映，不需要每次都呼叫 API；
 * 後端也不需要儲存這個衍生值，避免資料不一致。
 *
 * 台灣勞基法特休天數規則（2024）：
 * - 任職未滿 6 個月：0 天
 * - 任職滿 6 個月未滿 1 年：3 天
 * - 任職滿 1 年未滿 2 年：7 天
 * - 任職滿 2 年未滿 3 年：10 天
 * - 任職滿 3 年未滿 5 年：14 天
 * - 任職滿 5 年未滿 10 年：15 天
 * - 任職滿 10 年以上：每年加 1 天，最多 30 天
 */

export const useLeaveCalculator = () => {
  /**
   * 計算法定特休天數
   *
   * @param {string|Date} onboardDate - 員工到職日
   * @returns {number} 特休天數（整數）
   *
   * 計算邏輯：
   * 1. 先算「完整年數」（diffYears）：判斷是否跨越年份邊界
   * 2. 再算「總月數」（totalMonths）：用於判斷 6 個月和 12 個月的門檻
   * 3. 依照勞基法區間對應天數
   */
  const calculateLegalAnnualLeave = (onboardDate) => {
    // 無到職日則回傳 0（防止 onboardDate 為 null/undefined 時出錯）
    if (!onboardDate) return 0

    const start = new Date(onboardDate)
    const today = new Date()

    // 計算年份差
    let diffYears = today.getFullYear() - start.getFullYear()

    // 若今年還沒到達「到職當月當日」，年資未滿整年，需減 1
    const monthDiff = today.getMonth() - start.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
      diffYears--
    }

    // 計算總月數（用於判斷未滿 12 個月的情況）
    const totalMonths =
      (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth())

    // 依勞基法區間回傳對應天數
    if (totalMonths < 6) return 0    // 未滿 6 個月：無特休
    if (totalMonths < 12) return 3   // 滿 6 個月未滿 1 年：3 天
    if (diffYears < 2) return 7      // 滿 1 年未滿 2 年：7 天
    if (diffYears < 3) return 10     // 滿 2 年未滿 3 年：10 天
    if (diffYears < 5) return 14     // 滿 3 年未滿 5 年：14 天
    if (diffYears < 10) return 15    // 滿 5 年未滿 10 年：15 天

    // 滿 10 年以上：每年加 1 天（從第 11 年起），上限 30 天
    // (diffYears - 10 + 1) 表示超過 10 年的部分（第 11 年 = +1，第 12 年 = +2...）
    return Math.min(15 + (diffYears - 10 + 1), 30)
  }

  return {
    calculateLegalAnnualLeave,
  }
}
