/**
 * Pinia 狀態管理初始化 (Pinia Store Setup)
 *
 * 建立 Pinia 實體並掛載持久化插件（pinia-plugin-persistedstate）。
 * 這個檔案由 Quasar 的 boot 機制在應用啟動時自動載入。
 *
 * 為什麼需要 persistedstate 插件：
 * Pinia 的 store 預設是記憶體狀態，頁面重整後資料會消失。
 * persistedstate 讓指定的 store 欄位自動同步到 localStorage，
 * 重整後可以恢復狀態（例如保持登入、記住 token）。
 *
 * 各 store 的持久化設定在各自的 store 檔案中透過 { persist: {...} } 設定，
 * 這個檔案只負責啟用插件。
 */

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 建立 Pinia 實體
const pinia = createPinia()

// 掛載持久化插件，讓各 store 可以使用 persist 選項
pinia.use(piniaPluginPersistedstate)

export default pinia
