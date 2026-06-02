<!--
  員工帳號建立頁面 (Register Page)

  由 admin 操作，在系統中建立新員工帳號。
  這不是「使用者自助註冊」，而是「管理者新增員工帳號」的功能。
  （路由設有 admin: true meta，非 admin 無法進入此頁面）

  功能：
  - 帳號、密碼、確認密碼的前端驗證
  - 確認密碼欄位確保兩次輸入一致
  - 成功後回到登入頁（實際的員工資料由 admin 在人員管理頁填寫）
-->
<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <h1 class="text-h3 text-center q-mb-md">註冊</h1>

        <q-separator class="q-mb-md" />

        <!-- q-form 搭配 vee-validate，驗證通過後才執行 submit -->
        <q-form @submit="submit" class="q-gutter-y-md">
          <!-- 帳號輸入框（disabled 在提交中防止修改） -->
          <q-input
            v-model="account.value.value"
            :error="!!account.errorMessage.value"
            :error-message="account.errorMessage.value"
            label="帳號"
            hint="長度 4 ~ 20 的英數字"
            maxlength="20"
            counter
            outlined
            :disable="form.isSubmitting.value"
          />

          <!-- 密碼輸入框 -->
          <q-input
            v-model="password.value.value"
            :error="!!password.errorMessage.value"
            :error-message="password.errorMessage.value"
            label="密碼"
            hint="長度 4 ~ 20 的英數字、特殊符號"
            type="password"
            maxlength="20"
            counter
            outlined
            :disable="form.isSubmitting.value"
          />

          <!-- 確認密碼輸入框：透過 yup 的 .oneOf([yup.ref('password')]) 確保與密碼一致 -->
          <q-input
            v-model="confirmPassword.value.value"
            :error="!!confirmPassword.errorMessage.value"
            :error-message="confirmPassword.errorMessage.value"
            label="確認密碼"
            hint="長度 4 ~ 20 的英數字、特殊符號"
            type="password"
            maxlength="20"
            counter
            outlined
            :disable="form.isSubmitting.value"
          />

          <div class="row justify-center q-gutter-md">
            <!-- 取消：回到首頁（登入頁） -->
            <q-btn type="button" flat label="取消" color="primary" @click="router.push('/')" />
            <q-btn
              type="submit"
              flat
              color="primary"
              :loading="form.isSubmitting.value"
              label="註冊"
            />
          </div>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import validator from 'validator'
import { useField, useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
import serviceUser from 'src/services/user'

const $q = useQuasar()
const router = useRouter()

/**
 * 表單驗證 Schema（yup）
 * 帳號、密碼規則與登入頁相同，確保後端一定能通過驗證。
 * 確認密碼額外加上 .oneOf([yup.ref('password')]) 確保兩個密碼欄位一致，
 * 避免管理者輸入錯誤導致員工無法登入。
 */
const schema = yup.object({
  account: yup
    .string()
    .required('帳號必填')
    .min(4, '最少4個字')
    .max(20, '最多20個字')
    .test('isAlphanumeric', '帳號只能是英、數字', (value) =>
      value ? validator.isAlphanumeric(value) : true,
    ),
  password: yup
    .string()
    .required('密碼必填')
    .min(4, '密碼最少4個字')
    .max(20, '密碼最多20個字')
    .test('isAscii', '密碼只能是英、數字、特殊符號', (value) =>
      value ? validator.isAscii(value) : true,
    ),
  confirmPassword: yup
    .string()
    .required('密碼必填')
    .min(4, '密碼最少4個字')
    .max(20, '密碼最多20個字')
    .test('isAscii', '密碼只能是英、數字、特殊符號', (value) =>
      value ? validator.isAscii(value) : true,
    )
    // 確保確認密碼與密碼欄位相同
    .oneOf([yup.ref('password')], '密碼不一致'),
})

/**
 * vee-validate 表單設定
 * 以物件形式保存 form，讓 template 可以存取 isSubmitting 等狀態
 */
const form = useForm({
  validationSchema: schema,
  initialValues: {
    account: '',
    password: '',
    confirmPassword: '',
  },
})

// 建立各表單欄位（以物件形式保存，template 透過 account.value.value 存取）
const account = useField('account')
const password = useField('password')
const confirmPassword = useField('confirmPassword')

/**
 * 表單送出處理
 * 呼叫後端新增帳號 API（只需帳號密碼，其他員工資料在人員管理頁補填）
 * 成功後回到登入頁，失敗顯示錯誤通知
 */
const submit = form.handleSubmit(async (values) => {
  try {
    console.log('success')
    await serviceUser.create(values)

    $q.notify({
      color: 'positive',
      message: '註冊成功',
      icon: 'check',
      position: 'bottom',
    })

    // 建立成功後回到登入頁（不自動登入，讓員工自行登入）
    router.push('/')
  } catch (error) {
    console.log(error)
    // 後端錯誤訊息（如「帳號重複」）優先顯示
    const text = error?.response?.data?.message || '發生錯誤'

    $q.notify({
      color: 'negative',
      message: text,
      icon: 'report_problem',
      position: 'bottom',
    })
  }
})
</script>
