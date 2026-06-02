<!--
  登入頁面 (Login Page)

  提供帳號密碼登入表單，功能：
  - 帳號與密碼的前端即時驗證（vee-validate + yup）
  - 密碼顯示/隱藏切換
  - 呼叫後端登入 API，成功後更新 Pinia store 並導向出勤頁
  - 失敗時顯示 Quasar Notify 通知

  表單驗證設計：
  使用 vee-validate + yup schema 做前端驗證，
  在送出請求前先過濾明顯錯誤（太短、非英數字），
  減少無效的後端請求。

  為什麼不做「忘記密碼」功能：
  這是內部 HR 系統，帳號由 admin 建立，
  密碼重設由 admin 直接在人員管理頁面操作，不需要 email 重設流程。
-->
<template>
  <q-page class="row justify-center items-center">
    <div class="col-12 col-md-6 col-lg-4 q-pa-md">
      <q-separator class="q-my-md" />

      <!-- q-form 的 @submit 事件由 vee-validate 的 handleSubmit 包裝，
          確保驗證通過後才觸發 API 請求 -->
      <q-form @submit="submit" class="q-gutter-y-md">
        <!-- 帳號輸入框：counter 顯示字數，error 由 vee-validate 的 errorMessage 控制 -->
        <q-input
          v-model="accountValue"
          label="帳號"
          hint="長度 4 ~ 20 的英數字"
          counter
          maxlength="20"
          :error="!!accountError"
          :error-message="accountError"
          outlined
          dense
        />

        <!-- 密碼輸入框：isPwdVisible 控制是否顯示明文 -->
        <q-input
          v-model="passwordValue"
          label="密碼"
          hint="長度 4 ~ 20 的英數字、特殊符號"
          :type="isPwdVisible ? 'text' : 'password'"
          counter
          maxlength="20"
          :error="!!passwordError"
          :error-message="passwordError"
          outlined
          dense
        >
          <!-- 眼睛圖示：點擊切換密碼可見性 -->
          <template v-slot:append>
            <q-icon
              :name="isPwdVisible ? 'visibility' : 'visibility_off'"
              class="cursor-pointer"
              @click="isPwdVisible = !isPwdVisible"
            />
          </template>
        </q-input>

        <div class="row justify-end">
          <!-- loading 狀態由 vee-validate 的 isSubmitting 控制，防止重複提交 -->
          <q-btn label="登入" flat type="submit" color="primary" :loading="isSubmitting" />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import validator from 'validator'
import { useField, useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import * as yup from 'yup'
import serviceUser from 'src/services/user'
import { useUserStore } from 'stores/user'

const $q = useQuasar()
const router = useRouter()
const user = useUserStore()

// 控制密碼顯示/隱藏的狀態
const isPwdVisible = ref(false)

/**
 * 表單驗證 Schema（yup）
 * 定義帳號和密碼的格式規則，vee-validate 會自動整合並在輸入時即時驗證。
 * 前端驗證規則刻意與後端 model 的驗證保持一致，提供即時回饋。
 */
const schema = yup.object({
  account: yup
    .string()
    .required('帳號必填')
    .min(4, '最少4個字')
    .max(20, '最多20個字')
    // 自訂驗證：確保只有英文字母與數字（validator 函式庫）
    .test('isAlphanumeric', '帳號只能是英、數字', (value) =>
      value ? validator.isAlphanumeric(value) : true,
    ),
  password: yup
    .string()
    .required('密碼必填')
    .min(4, '密碼最少8個字')
    .max(20, '密碼最多20個字')
    // 允許英數字與特殊符號（ASCII 可見字元）
    .test('isAscii', '密碼只能是英、數字、特殊符號', (value) =>
      value ? validator.isAscii(value) : true,
    ),
})

/**
 * vee-validate 表單設定
 * handleSubmit：包裝送出邏輯，只有所有欄位驗證通過才執行 callback
 * isSubmitting：API 請求期間為 true，防止重複送出
 */
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    account: '',
    password: '',
  },
})

// 建立表單欄位（與 schema 的欄位名稱對應）
// value：雙向綁定到 q-input 的 v-model
// errorMessage：驗證失敗時的錯誤訊息，綁定到 q-input 的 error-message
const { value: accountValue, errorMessage: accountError } = useField('account')
const { value: passwordValue, errorMessage: passwordError } = useField('password')

/**
 * 表單送出處理
 * 1. 呼叫登入 API
 * 2. 成功：更新 Pinia store，顯示成功通知，導向出勤頁
 * 3. 失敗：顯示後端回傳的錯誤訊息（如「帳號或密碼錯誤」）
 */
const submit = handleSubmit(async (values) => {
  try {
    const { data } = await serviceUser.login(values)
    // 登入成功：將後端回傳的使用者資料（含 token）填入 store
    user.login(data.result)

    $q.notify({
      message: '登入成功',
      color: 'positive',
      icon: 'check_circle',
      position: 'bottom',
    })

    // 導向主要功能頁面（出勤頁）
    router.push('/attendance')
  } catch (error) {
    console.log(error)
    // 優先使用後端的錯誤訊息，fallback 為通用錯誤
    const text = error?.response?.data?.message || '發生錯誤'

    $q.notify({
      message: text,
      color: 'negative',
      icon: 'error',
      position: 'bottom',
    })
  }
})
</script>
