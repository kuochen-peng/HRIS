# HRIS | 出勤管理系統

> 人力資源資訊系統，提供員工打卡、請假申請、人事管理等核心功能。

---

## 專案簡介

一般員工可進行打卡簽到、查看紀錄、提出請假申請；管理員另可管理員工帳號與人事資料。

---

## 功能特色

- **登入 / 驗證** — JWT 身份驗證，搭配 Passport.js Local Strategy
- **打卡紀錄** — 員工上下班打卡，查看個人出勤紀錄
- **請假申請** — 填寫請假單、查看申請狀態（一般員工）
- **人事管理** _(管理員)_ — 查閱與管理所有員工資料
- **帳號註冊** _(管理員)_ — 新增員工帳號
- **圖片上傳** — 頭像等媒體資源透過 Cloudinary 雲端儲存

---

## 使用技術

| 技術                                                                                   | 版本      | 用途                                        |
| -------------------------------------------------------------------------------------- | --------- | ------------------------------------------- |
| [Vue 3](https://vuejs.org/) + Composition API                                          | ^3.5.22   | 主框架，採用 Composition API 組織邏輯       |
| [Quasar Framework](https://quasar.dev/)                                                | ^2.16.0   | UI 元件庫與專案鷹架（按鈕、表單、對話框等） |
| [Vue Router](https://router.vuejs.org/)                                                | ^5.0.0    | 管理頁面路由與導航守衛                      |
| [Pinia](https://pinia.vuejs.org/)                                                      | ^3.0.1    | 全域狀態管理（使用者資訊）                  |
| [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) | ^4.7.1    | Pinia 狀態持久化（localStorage）            |
| [Axios](https://axios-http.com/)                                                       | ^1.2.1    | HTTP 請求，與後端 API 溝通                  |
| [VeeValidate](https://vee-validate.logaretm.com/)                                      | ^4.15.1   | 表單驗證框架                                |
| [Yup](https://github.com/jquense/yup)                                                  | ^1.7.1    | 表單驗證 Schema 定義                        |
| [validator](https://github.com/validatorjs/validator.js)                               | ^13.15.26 | 字串格式驗證工具                            |
| [Vite](https://vitejs.dev/) (via @quasar/app-vite)                                     | ^2.1.0    | 快速開發伺服器與生產建置                    |

---

## 專案結構

```
HRIS_project/
├── back/                        # 後端 (Express + MongoDB)
│   ├── index.js                 # 伺服器入口
│   ├── routes/
│   │   ├── user.js              # 使用者路由
│   │   ├── attendance.js        # 打卡路由
│   │   └── leaveRequest.js      # 請假路由
│   ├── controllers/
│   │   ├── user.js              # 使用者邏輯
│   │   ├── attendance.js        # 打卡邏輯
│   │   └── leaveRequest.js      # 請假邏輯
│   ├── models/
│   │   ├── user.js              # 使用者資料模型
│   │   ├── attendance.js        # 打卡紀錄模型
│   │   └── leaveRequest.js      # 請假申請模型
│   ├── middlewares/             # 自訂中介層（驗證、權限）
│   ├── passport/                # Passport 策略設定
│   └── cloudinary/              # Cloudinary 設定
│
└── quasar-project/              # 前端 (Vue 3 + Quasar)
    └── src/
        ├── pages/
        │   ├── loginPage.vue        # 登入頁
        │   ├── attendancePage.vue   # 打卡紀錄頁
        │   ├── leaveRequestPage.vue # 請假申請頁
        │   ├── registerPage.vue     # 帳號註冊頁（管理員）
        │   ├── memberPage.vue       # 人事管理頁（管理員）
        │   └── ErrorNotFound.vue    # 404 頁面
        ├── layouts/
        │   └── MainLayout.vue       # 主版型（側邊欄、導航）
        ├── components/              # 可重用元件
        ├── composables/
        │   └── useLeaveCalculator.js # 假期計算 Composable
        ├── services/
        │   ├── user.js              # 使用者 API
        │   ├── attendance.js        # 打卡 API
        │   └── leaveRequest.js      # 請假 API
        ├── stores/
        │   └── user.js              # 使用者全域狀態（Pinia）
        ├── router/
        │   └── routes.js            # 路由定義與導航守衛
        ├── boot/
        │   └── axios.js             # Axios 全域設定
        └── css/
            ├── app.scss             # 全域樣式
            └── quasar.variables.scss # Quasar 主題變數
```
