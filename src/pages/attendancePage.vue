<!--
  出勤頁面 (Attendance Page)

  這是員工最常使用的頁面，整合了以下功能區塊：

  1. 打卡區（左半）：
    - 即時時鐘（每秒更新）
    - 上班/下班打卡按鈕（依狀態動態切換文字與顏色）
    - 上下班時間顯示
    - 假期額度顯示（特休、病假、事假、補休）

  2. 月曆區（右半）：
    - 本月日曆，每天依出勤狀態標示顏色
    - 從台灣假日 API 取得台灣節假日，自動標示休假日

  3. 統計卡片（中段）：
    - 本月累積工時（含進度條）
    - 本月平均上班時間
    - 本月異常天數
    - 本月累積加班時數

  4. 打卡紀錄表格（下段）：
    - 完整出勤歷史，含上下班時間、時長、狀態、當日請假

  5. 請假申請 Dialog：
    - 從此頁快速提交請假，附件上傳支援
    - 起迄時間自動計算總時數

  6. 補休額度編輯 Dialog（admin 限定）：
    - 管理員可直接調整補休天數
-->
<template>
  <q-page class="q-pa-lg">
    <!-- 第一列：打卡區 + 月曆區 -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-md-8">
        <q-card bordered flat class="full-height border-radius-lg">
          <div class="row full-height">
            <!-- 左側：即時時鐘 + 打卡按鈕 + 上下班時間設定 -->
            <div
              class="col-12 col-sm-5 q-pa-xl column justify-center"
              style="border-right: 1px solid #f0f0f0"
            >
              <!-- 即時時鐘：now 每秒更新，formatDate 格式化為 HH:mm:ss -->
              <div
                class="text-h2 text-weight-bolder text-dark q-mb-sm"
                style="letter-spacing: -1.5px"
              >
                {{ date.formatDate(now, 'HH:mm:ss') }}
              </div>

              <!-- 打卡按鈕：
                  - isClockedOutToday 為 true → 按鈕 disabled（今日已完成打卡）
                  - isClockedIn 為 true → 顯示「下班打卡」（已打上班卡，等待下班）
                  - 否則 → 顯示「上班打卡」 -->
              <q-btn
                :color="isClockedIn ? 'negative' : 'primary'"
                :icon-right="isClockedIn ? 'login' : 'logout'"
                :label="isClockedOutToday ? '已下班' : isClockedIn ? '下班打卡' : '上班打卡'"
                size="lg"
                class="full-width rounded-borders text-weight-bold shadow-2"
                no-caps
                @click="isClockedIn ? clockOut() : clockIn()"
                :loading="loading"
                :disable="isClockedOutToday"
              />
            </div>

            <!-- 右側：上下班時間、假期額度、快速請假按鈕 -->
            <div class="col-12 col-sm-7 q-pa-xl column justify-center">
              <div class="row items-center justify-between q-mb-lg">
                <div class="q-gutter-x-sm">
                  <!-- 快速請假按鈕：開啟請假 Dialog -->
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="add_circle"
                    label="請假"
                    class="text-weight-bold"
                    @click="openLeaveDialog"
                  />
                </div>
              </div>

              <!-- 上下班時間顯示（從 user store 的 work 設定讀取） -->
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="row items-center q-mb-lg">
                    <q-avatar
                      color="green-1"
                      text-color="positive"
                      icon="schedule"
                      rounded
                      class="q-mr-md"
                    />
                    <div>
                      <div class="text-caption text-grey-7 text-uppercase text-weight-bold">
                        上班
                      </div>
                      <div class="text-body1 text-weight-bold">
                        {{ user.work?.workStartTime || '09:00' }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="row items-center q-mb-lg">
                    <q-avatar
                      color="green-1"
                      text-color="positive"
                      icon="schedule"
                      rounded
                      class="q-mr-md"
                    />
                    <div>
                      <div class="text-caption text-grey-7 text-uppercase text-weight-bold">
                        下班
                      </div>
                      <div class="text-body1 text-weight-bold">
                        {{ user.work?.workEndTime || '18:00' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <q-separator class="q-mb-lg" flat style="background: #f0f0f0" />

              <!-- 假期額度區：admin 可看到編輯按鈕 -->
              <div class="row items-center justify-between q-mb-lg">
                <div class="q-gutter-x-sm">
                  <q-btn
                    v-if="user.isAdmin"
                    flat
                    dense
                    color="grey-7"
                    icon="edit"
                    label="編輯"
                    class="text-weight-bold"
                    @click="openQuotaDialog"
                  />
                </div>
              </div>

              <!-- 假期額度卡片：由 quotaDisplay computed 產生 -->
              <div class="row q-col-gutter-md">
                <div class="col-6" v-for="(val, key) in quotaDisplay" :key="key">
                  <div class="row items-center q-mb-sm">
                    <q-avatar
                      :color="val.color + '-1'"
                      :text-color="val.color"
                      :icon="val.icon"
                      rounded
                      size="32px"
                      class="q-mr-sm"
                    />
                    <div>
                      <div
                        class="text-caption text-grey-6 text-weight-bold"
                        style="font-size: 10px"
                      >
                        {{ val.label }}
                      </div>
                      <div class="text-body2 text-weight-bold">{{ val.value }} 小時</div>
                      <div class="text-grey-5" style="font-size: 10px">{{ val.hint }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- 右側：月曆 -->
      <div class="col-12 col-md-4">
        <q-card bordered flat class="full-height border-radius-lg q-pa-lg">
          <!-- 月曆標頭：月份名稱與年份 -->
          <div class="row justify-between items-center q-mb-lg">
            <div class="text-h6 text-weight-bold">{{ date.formatDate(calendarDate, 'MMM') }}</div>
            <q-badge color="grey-2" text-color="grey-8" class="text-weight-bold q-px-sm py-xs">
              {{ date.formatDate(calendarDate, 'YYYY') }}
            </q-badge>
          </div>

          <!-- 星期標頭列：週日和週六用橘色標示 -->
          <div class="row text-center text-grey-5 text-caption text-weight-bold q-mb-sm">
            <div class="col text-orange-4">日</div>
            <div class="col">一</div>
            <div class="col">二</div>
            <div class="col">三</div>
            <div class="col">四</div>
            <div class="col">五</div>
            <div class="col text-orange-4">六</div>
          </div>

          <!-- 月曆格子：用 CSS Grid 排列，7 欄對應 7 天
              每個格子的顏色由 calendar computed 根據出勤狀態決定
              today-border 對今日加上醒目邊框 -->
          <div
            class="q-mb-md"
            style="
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 4px;
              text-align: center;
            "
          >
            <div v-for="(day, index) in calendar" :key="index">
              <q-avatar
                v-if="day.date"
                :color="day.color"
                :text-color="day.textColor"
                size="36px"
                class="text-weight-bold shadow-1-hover cursor-pointer"
                :class="{
                  'opacity-50': day.disabled,
                  'today-border': day.isToday,
                }"
              >
                {{ day.date }}
              </q-avatar>
              <!-- 空白佔位（月份第一天前的填充） -->
              <div v-else style="height: 36px"></div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- 顏色圖例說明 -->
          <div class="text-body2">
            <div class="row items-center q-mb-sm">
              <q-badge
                rounded
                color="positive"
                class="q-mr-sm"
                size="xs"
                style="width: 8px; height: 8px"
              />
              <span class="text-grey-8">正常打卡</span>
            </div>
            <div class="row items-center q-mb-sm">
              <q-badge
                rounded
                color="orange"
                class="q-mr-sm"
                size="xs"
                style="width: 8px; height: 8px"
              />
              <span class="text-grey-8">遲到 / 早退</span>
            </div>
            <div class="row items-center q-mb-sm">
              <q-badge
                rounded
                color="negative"
                class="q-mr-sm"
                size="xs"
                style="width: 8px; height: 8px"
              />
              <span class="text-grey-8">曠職 / 缺勤</span>
            </div>
            <div class="row items-center">
              <q-badge
                rounded
                color="grey-2"
                class="q-mr-sm"
                size="xs"
                style="width: 8px; height: 8px"
              />
              <span class="text-grey-8">休假 / 週末</span>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- 第二列：統計卡片（本月工時、平均上班時間、異常天數、加班時數） -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-md-3" v-for="(stat, index) in stats" :key="index">
        <q-card bordered flat class="border-radius-lg q-pa-lg full-height">
          <div
            class="text-caption text-grey-7 text-uppercase text-weight-bold tracking-wide q-mb-sm"
          >
            {{ stat.title }}
          </div>
          <div class="text-h4 text-weight-bold q-mb-md">{{ stat.value }}</div>

          <!-- 進度條型（本月工時卡片用） -->
          <template v-if="stat.type === 'progress'">
            <q-linear-progress
              :value="stat.progress"
              color="primary"
              size="6px"
              class="rounded-borders q-mb-sm"
            />
            <div class="text-caption text-grey-6">{{ stat.subtext }}</div>
          </template>

          <!-- 文字型（其他統計卡片用） -->
          <template v-else>
            <div
              class="text-caption row items-center text-weight-medium"
              :class="stat.subtextColor"
            >
              <q-icon :name="stat.icon" class="q-mr-xs" size="14px" v-if="stat.icon" />
              {{ stat.subtext }}
            </div>
          </template>
        </q-card>
      </div>
    </div>

    <!-- 第三列：打卡紀錄表格 -->
    <q-card bordered flat class="border-radius-lg">
      <div class="row items-center justify-between q-pa-lg border-bottom">
        <div class="text-h6 text-weight-bold">打卡紀錄</div>
      </div>

      <q-table
        :rows="logs"
        :columns="columns"
        row-key="date"
        flat
        class="header-transparent text-body1"
      >
        <!-- 自訂表頭樣式 -->
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-grey-6 text-weight-bold text-uppercase"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- 狀態欄：依出勤狀態顯示不同顏色的 badge -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="
                props.row.status === '正常'
                  ? 'green-1'
                  : props.row.status === '曠職 / 缺勤'
                    ? 'red-1'
                    : 'orange-1'
              "
              :text-color="
                props.row.status === '正常'
                  ? 'positive'
                  : props.row.status === '曠職 / 缺勤'
                    ? 'negative'
                    : 'orange'
              "
              class="q-px-sm py-xs text-weight-bold"
            >
              {{ props.row.status }}
            </q-badge>
          </q-td>
        </template>

        <!-- 時長欄：加粗顯示 -->
        <template v-slot:body-cell-duration="props">
          <q-td :props="props" class="text-weight-bold">
            {{ props.row.duration }}
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 請假申請 Dialog -->
    <q-dialog v-model="leaveDialog.show" persistent>
      <q-card style="min-width: 400px" class="q-pa-md border-radius-lg">
        <q-card-section class="row items-center">
          <div class="text-h6 text-weight-bold">請假</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="submitLeave" class="q-gutter-md">
            <!-- 假別選擇 -->
            <q-select
              outlined
              v-model="leaveTypeVal"
              :options="['特休', '病假', '事假', '補休']"
              label="假別"
              :error="!!leaveTypeError"
              :error-message="leaveTypeError"
            />

            <!-- 請假日期 -->
            <q-input
              outlined
              v-model="dateVal"
              label="日期"
              type="date"
              :error="!!dateError"
              :error-message="dateError"
            />

            <!-- 起迄時間（輸入後自動計算總時數） -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  outlined
                  v-model="startTimeVal"
                  label="開始時間"
                  type="time"
                  :error="!!startTimeError"
                  :error-message="startTimeError"
                  @update:model-value="calculateHours"
                />
              </div>
              <div class="col-6">
                <q-input
                  outlined
                  v-model="endTimeVal"
                  label="結束時間"
                  type="time"
                  :error="!!endTimeError"
                  :error-message="endTimeError"
                  @update:model-value="calculateHours"
                />
              </div>
            </div>

            <!-- 總時數：自動計算，唯讀 -->
            <q-input
              outlined
              v-model="totalHoursVal"
              label="總時數"
              type="number"
              suffix="小時"
              readonly
              hint="根據起迄時間自動計算"
              :error="!!totalHoursError"
              :error-message="totalHoursError"
            />

            <!-- 備註說明 -->
            <q-input
              outlined
              v-model="commentVal"
              label="備註 / 原因"
              type="textarea"
              :error="!!commentError"
              :error-message="commentError"
            />

            <!-- 附件上傳（病假等需要檢附證明） -->
            <q-file
              outlined
              v-model="attachmentVal"
              label="上傳附件 (圖片或文件)"
              accept=".jpg, .jpeg, .png, .pdf, .doc, .docx"
              :error="!!attachmentError"
              :error-message="attachmentError"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="取消" v-close-popup class="q-mr-sm" />
              <q-btn
                unelevated
                color="primary"
                label="申請"
                type="submit"
                :loading="isSubmitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 補休額度編輯 Dialog（admin 限定） -->
    <q-dialog v-model="quotaDialog.show" persistent>
      <q-card style="min-width: 400px" class="q-pa-md border-radius-lg">
        <q-card-section class="row items-center">
          <div class="text-h6 text-weight-bold">編輯補休</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="submitQuota" class="q-gutter-md">
            <div class="text-caption text-grey-7 q-mb-sm">
              * 目前到職日：{{
                user.onboardDate ? date.formatDate(user.onboardDate, 'YYYY-MM-DD') : '未設定'
              }}<br />
              * 特休 (年資計算)、病假 (30天)、事假 (14天)。
            </div>

            <q-input
              v-model="compLeaveVal"
              label="補休天數"
              outlined
              suffix="天"
              hint="調整員工的補休總額"
              type="number"
              :error="!!compLeaveError"
              :error-message="compLeaveError"
            />

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="取消" v-close-popup class="q-mr-sm" />
              <q-btn
                unelevated
                color="primary"
                label="儲存"
                type="submit"
                :loading="isQuotaSubmitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useQuasar, date } from 'quasar'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useUserStore } from 'src/stores/user'
import serviceAttendance from 'src/services/attendance'
import serviceLeaveRequest from 'src/services/leaveRequest'
import serviceUser from 'src/services/user'
import axios from 'axios'
import { useLeaveCalculator } from 'src/composables/useLeaveCalculator'

const $q = useQuasar()
const user = useUserStore()

// 引入特休天數計算邏輯（依勞基法年資計算）
const { calculateLegalAnnualLeave } = useLeaveCalculator()

// 頁面狀態
const loading = ref(false) // 打卡 API 請求中
const logs = ref([]) // 出勤紀錄列表
const isClockedIn = ref(false) // 今日已打上班卡但尚未下班
const isClockedOutToday = ref(false) // 今日已完成下班打卡
const holidays = ref([]) // 台灣節假日日期清單（YYYY-MM-DD 格式）
const now = ref(Date.now()) // 即時時間（每秒更新）
const calendarDate = ref(Date.now()) // 月曆顯示的月份（目前固定為當月）
const myLeaveRequests = ref([]) // 個人請假紀錄（用於計算假期餘額）
let timer = null // setInterval 的 ID，unmount 時清除

// Dialog 狀態
const leaveDialog = ref({ show: false })
const quotaDialog = ref({ show: false })

/**
 * 上班打卡
 * 呼叫後端 API 後重新取得出勤紀錄以更新 UI
 */
const clockIn = async () => {
  try {
    loading.value = true
    await serviceAttendance.checkIn()
    $q.notify({ message: '上班打卡成功', color: 'positive', icon: 'check_circle' })
    await getAttendance()
  } catch (error) {
    const message = error?.response?.data?.message || '打卡失敗'
    $q.notify({ message, color: 'negative', icon: 'error' })
  } finally {
    loading.value = false
  }
}

/**
 * 下班打卡
 * 呼叫後端 API 後重新取得出勤紀錄以更新 UI
 */
const clockOut = async () => {
  try {
    loading.value = true
    await serviceAttendance.checkOut()
    $q.notify({ message: '下班打卡成功', color: 'positive', icon: 'check_circle' })
    await getAttendance()
  } catch (error) {
    const message = error?.response?.data?.message || '下班打卡失敗'
    $q.notify({ message, color: 'negative', icon: 'error' })
  } finally {
    loading.value = false
  }
}

/**
 * 請假表單驗證 Schema
 * attachment 用 .mixed() 做檔案大小與格式的自訂驗證
 */
const leaveSchema = yup.object({
  leaveType: yup.string().required('請選擇假別'),
  date: yup.string().required('請選擇日期'),
  startTime: yup.string().required('請輸入開始時間'),
  endTime: yup.string().required('請輸入結束時間'),
  totalHours: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v)) // NaN 轉為 0 讓後續驗證可以正確執行
    .positive('必須大於0')
    .required('請輸入有效時數'),
  comment: yup.string(),
  attachment: yup
    .mixed()
    .test('fileSize', '檔案太大 (限制 5MB)', (value) => {
      if (!value) return true
      return value.size <= 5242880 // 5MB = 5 * 1024 * 1024
    })
    .test('fileType', '檔案格式不符', (value) => {
      if (!value) return true
      // 只允許圖片和文件格式
      return [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(value.type)
    }),
})

// 請假表單
const { handleSubmit, resetForm, isSubmitting } = useForm({
  validationSchema: leaveSchema,
  initialValues: {
    leaveType: '',
    date: '',
    startTime: '',
    endTime: '',
    totalHours: 0,
    comment: '',
    attachment: null,
  },
})

// 請假表單欄位
const { value: leaveTypeVal, errorMessage: leaveTypeError } = useField('leaveType')
const { value: dateVal, errorMessage: dateError } = useField('date')
const { value: startTimeVal, errorMessage: startTimeError } = useField('startTime')
const { value: endTimeVal, errorMessage: endTimeError } = useField('endTime')
const { value: totalHoursVal, errorMessage: totalHoursError } = useField('totalHours')
const { value: commentVal, errorMessage: commentError } = useField('comment')
const { value: attachmentVal, errorMessage: attachmentError } = useField('attachment')

// 補休額度編輯表單
const quotaSchema = yup.object({
  compLeave: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .min(0, '不能小於0')
    .required('請輸入補休天數'),
})

const {
  handleSubmit: handleQuotaSubmit,
  resetForm: resetQuotaForm,
  isSubmitting: isQuotaSubmitting,
} = useForm({
  validationSchema: quotaSchema,
  initialValues: { compLeave: 0 },
})

const { value: compLeaveVal, errorMessage: compLeaveError } = useField('compLeave')

/**
 * 假期額度顯示（computed）
 * 將各假別的法定總額與已使用量計算成剩餘小時數。
 *
 * 設計說明：
 * - 特休：由 useLeaveCalculator 依到職日計算法定天數 × 8 小時
 * - 病假、事假：固定法規上限（30天、14天）× 8 小時
 * - 補休：從 user.leaveQuota.compLeave 取得管理員設定的天數 × 8 小時
 * - 已使用量：從 myLeaveRequests 中篩出「已同意」且今年的申請加總
 *   （注意：getUsedHours 函式沒有按假別篩選，目前實作是扣全部假別的合計，
 *    這是一個潛在的 bug，但維持原始程式碼不修改）
 */
const quotaDisplay = computed(() => {
  const currentYear = new Date().getFullYear()
  const q = user.leaveQuota || {}

  // 計算法定總額（單位：小時）
  const totalAnnualHours = calculateLegalAnnualLeave(user.onboardDate) * 8
  const totalSickHours = 30 * 8
  const totalPersonalHours = 14 * 8
  const totalCompHours = (q.compLeave || 0) * 8

  // 計算當年度已請假總時數（所有假別合計）
  const getUsedHours = () => {
    return myLeaveRequests.value
      .filter((req) => req.status === '已同意' && new Date(req.date).getFullYear() === currentYear)
      .reduce((sum, req) => sum + (req.totalHours || 0), 0)
  }

  return [
    {
      label: '剩餘特休',
      value: Math.max(totalAnnualHours - getUsedHours('特休'), 0), // 確保不顯示負數
      color: 'blue',
      icon: 'beach_access',
      hint: `法定總額: ${totalAnnualHours / 8} 天/年`,
    },
    {
      label: '剩餘病假',
      value: Math.max(totalSickHours - getUsedHours('病假'), 0),
      color: 'red',
      icon: 'medical_services',
      hint: '法規上限: 30 天/年',
    },
    {
      label: '剩餘事假',
      value: Math.max(totalPersonalHours - getUsedHours('事假'), 0),
      color: 'purple',
      icon: 'person',
      hint: '法規上限: 14 天/年',
    },
    {
      label: '累積補休',
      value: Math.max(totalCompHours, 0),
      color: 'orange',
      icon: 'history',
      hint: '公司規定',
    },
  ]
})

// 取得個人請假紀錄（用於計算假期餘額）
const fetchMyLeaves = async () => {
  try {
    const { data } = await serviceLeaveRequest.getMyLeaveRequest()
    myLeaveRequests.value = data.result
  } catch (error) {
    console.error('獲取請假紀錄失敗:', error)
  }
}

/**
 * 自動計算請假時數
 * 當使用者輸入開始/結束時間後觸發，以 30 分鐘為最小單位（Math.ceil ... 0.5）
 */
const calculateHours = () => {
  const startTime = startTimeVal.value
  const endTime = endTimeVal.value
  if (!startTime || !endTime) return

  // 將 HH:mm 轉換為分鐘數再計算差值
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startTotal = startH * 60 + startM
  const endTotal = endH * 60 + endM

  let diff = endTotal - startTotal
  if (diff < 0) diff = 0 // 防止結束時間早於開始時間出現負數

  // 以 30 分鐘為最小單位（Math.ceil(diff / 30) * 0.5）
  totalHoursVal.value = Math.ceil(diff / 30) * 0.5
}

// 開啟請假 Dialog 並重置表單
const openLeaveDialog = () => {
  resetForm()
  leaveDialog.value.show = true
}

/**
 * 提交請假申請
 * 因為有附件，需要用 FormData 格式（multipart/form-data）送出，
 * 而非一般的 JSON。後端的 multer 中間件負責解析並上傳 Cloudinary。
 */
const submitLeave = handleSubmit(async (values) => {
  try {
    const { date, startTime, endTime, attachment, ...data } = values

    // 建立 FormData 並一一 append 欄位
    const fd = new FormData()
    fd.append('leaveType', data.leaveType)
    fd.append('date', new Date(date).toISOString())
    // 將日期 + 時間組合成完整 ISO 時間戳
    fd.append('startTime', new Date(`${date}T${startTime}`).toISOString())
    fd.append('endTime', new Date(`${date}T${endTime}`).toISOString())
    fd.append('totalHours', data.totalHours)
    fd.append('comment', data.comment)

    // 只有有附件時才 append（後端判斷 req.file 是否存在）
    if (attachment) {
      fd.append('attachment', attachment)
    }

    await serviceLeaveRequest.create(fd)
    $q.notify({ message: '請假申請已送出', color: 'positive', icon: 'check_circle' })
    leaveDialog.value.show = false
    fetchMyLeaves() // 更新假期餘額顯示
  } catch (error) {
    const message = error?.response?.data?.message || '申請失敗'
    $q.notify({ message, color: 'negative', icon: 'error' })
  }
})

// 開啟補休額度編輯 Dialog，並預填目前的補休天數
const openQuotaDialog = () => {
  resetQuotaForm({
    values: {
      compLeave: user.leaveQuota?.compLeave || 0,
    },
  })
  quotaDialog.value.show = true
}

// 提交補休額度更新（admin 操作）
const submitQuota = handleQuotaSubmit(async (values) => {
  try {
    const { data } = await serviceUser.updateUser(user._id, {
      leaveQuota: {
        compLeave: values.compLeave,
      },
    })
    // 更新 store 中的假期額度，讓畫面即時反映
    user.leaveQuota = data.result.leaveQuota
    $q.notify({ message: '更新成功', color: 'positive', icon: 'check_circle' })
    quotaDialog.value.show = false
  } catch (error) {
    const message = error?.response?.data?.message || '更新失敗'
    $q.notify({ message, color: 'negative', icon: 'error' })
  }
})

/**
 * 載入台灣節假日資料
 * 從 GitHub CDN 的 TaiwanCalendar 專案取得指定年份的假日資料，
 * 用於月曆上標示休假日（影響統計卡片的「應上班天數」計算）
 */
const loadHolidays = async (year) => {
  try {
    const { data } = await axios.get(
      `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`,
    )

    // 篩出假日，並將 'YYYYMMDD' 格式轉換為 'YYYY-MM-DD' 格式
    holidays.value = data
      .filter((day) => day.isHoliday)
      .map((day) => {
        const y = day.date.substring(0, 4)
        const m = day.date.substring(4, 6)
        const d = day.date.substring(6, 8)
        return `${y}-${m}-${d}`
      })
  } catch (error) {
    console.error('無法取得台灣節假日資料', error)
  }
}

/**
 * 計算出勤時長顯示字串
 * 將上下班時間差轉換為「Xh Ym」格式
 */
const getDuration = (start, end) => {
  if (!start || !end) return '-'

  const startDate = new Date(start)
  const endDate = new Date(end)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-'

  const diff = endDate - startDate
  if (diff < 0) return '-'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

/**
 * 取得出勤紀錄並更新 UI 狀態
 * 同時更新：
 * - isClockedIn：今日打卡狀態（用於打卡按鈕顯示）
 * - isClockedOutToday：今日是否已完成打卡
 * - logs：格式化後的出勤紀錄（用於表格和月曆）
 */
const getAttendance = async () => {
  try {
    const { data } = await serviceAttendance.getAttendance()

    const todayStr = date.formatDate(Date.now(), 'YYYY-MM-DD')

    // 找今天的出勤紀錄
    const todayLog = data.result.find((log) => {
      return date.formatDate(log.date, 'YYYY-MM-DD') === todayStr
    })

    if (todayLog) {
      // 有上班卡且無下班卡 → 顯示「下班打卡」
      isClockedIn.value = !!todayLog.checkIn && !todayLog.checkOut
      // 有下班卡 → 今日已完成，按鈕 disabled
      isClockedOutToday.value = !!todayLog.checkOut
    } else {
      // 今天沒有紀錄 → 顯示「上班打卡」
      isClockedIn.value = false
      isClockedOutToday.value = false
    }

    // 格式化出勤紀錄（後端回傳完整時間戳，前端只需顯示時分）
    logs.value = data.result.map((log) => {
      const logDateStr = date.formatDate(log.date, 'YYYY-MM-DD')

      // 找同日期且已同意的請假（在月曆和表格上顯示請假標記）
      const leave = myLeaveRequests.value.find(
        (l) => l.status === '已同意' && date.formatDate(l.date, 'YYYY-MM-DD') === logDateStr,
      )

      return {
        ...log,
        date: logDateStr,
        checkIn: date?.formatDate(log.checkIn, 'HH:mm'), // 只顯示時分
        checkOut: date?.formatDate(log.checkOut, 'HH:mm'),
        duration: getDuration(log.checkIn, log.checkOut),
        status: log.status || '未定義',
        leave: leave?.leaveType, // 當日請假類型（可能為 undefined）
      }
    })
  } catch (error) {
    console.log(error)
    $q.notify({ message: '無法取得打卡紀錄', color: 'negative', icon: 'error' })
  }
}

/**
 * 月曆資料（computed）
 * 根據當月的出勤紀錄與假日資料，產生每個日期格子的顯示設定
 *
 * 每個格子物件：
 * { date, color, textColor, disabled, isToday }
 *
 * 顏色邏輯：
 * - 有出勤紀錄 → 依狀態決定顏色（正常=green, 遲到/早退=orange, 曠職=red）
 * - 週末或假日 → grey-2（淡灰，disabled）
 * - 無紀錄且非假日 → transparent（透明）
 */
const calendar = computed(() => {
  const current = new Date(calendarDate.value)
  const year = current.getFullYear()
  const month = current.getMonth()
  const daysInMonth = date.daysInMonth(current)

  const days = []

  // 計算月份第一天是週幾，並在前面填充空白格子
  const firstDay = new Date(year, month, 1)
  const startPadding = firstDay.getDay() // 0=週日, 1=週一...
  for (let i = 0; i < startPadding; i++) {
    days.push({ date: '', color: 'transparent', disabled: true })
  }

  const today = new Date(calendarDate.value)
  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  // 產生每天的格子設定
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const dateStr = date.formatDate(d, 'YYYY-MM-DD')
    const dayOfWeek = d.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 週日=0, 週六=6
    const isHoliday = holidays.value.includes(dateStr)
    const isToday = i === todayDate && month === todayMonth && year === todayYear

    let color = 'transparent'
    let textColor = 'dark'
    let disabled = false

    // 找對應的出勤紀錄
    const log = logs.value.find((l) => l.date === dateStr)

    if (log) {
      // 有出勤紀錄：依狀態顯示顏色
      textColor = 'white'
      if (log.status === '正常') color = 'positive'
      else if (log.status === '遲到' || log.status === '早退') color = 'orange'
      else color = 'negative'
    } else if (isWeekend || isHoliday) {
      // 週末或假日：灰色並 disabled
      color = 'grey-2'
      textColor = 'grey-5'
      disabled = true
    }

    days.push({
      date: i.toString(),
      color,
      textColor,
      disabled,
      isToday,
    })
  }

  return days
})

/**
 * 統計卡片資料（computed）
 * 根據本月出勤紀錄計算四項統計數據：
 * 1. 本月累積工時（含進度條，對比應上班時數）
 * 2. 平均上班打卡時間
 * 3. 異常天數（非「正常」的紀錄數量）
 * 4. 本月累積加班（下班打卡晚於設定下班時間的分鐘數累計）
 */
const stats = computed(() => {
  const nowObj = new Date()
  const currentMonth = nowObj.getMonth()
  const currentYear = nowObj.getFullYear()

  // 計算本月應上班天數（排除週末和台灣假日）
  const daysInMonth = date.daysInMonth(nowObj)
  let workingDaysCount = 0
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentYear, currentMonth, i)
    const dateStr = date.formatDate(d, 'YYYY-MM-DD')
    const dayOfWeek = d.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidays.value.includes(dateStr)

    if (!isWeekend && !isHoliday) {
      workingDaysCount++
    }
  }
  // 應上班的總分鐘數（用於工時進度條的計算）
  const targetHours = workingDaysCount * 8
  const targetTotalMinutes = targetHours * 60

  // 篩出本月的出勤紀錄
  const monthLogs = logs.value.filter((log) => {
    const d = new Date(log.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // 計算本月總工時（分鐘）
  let totalMinutes = 0
  monthLogs.forEach((log) => {
    if (log.duration && log.duration !== '-') {
      // duration 格式為 'Xh Ym'，用 regex 提取數字
      const match = log.duration.match(/(\d+)h (\d+)m/)
      if (match) {
        totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2])
      }
    }
  })
  const totalHoursStr = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`

  // 計算本月平均上班打卡時間
  let totalCheckInMinutes = 0
  let checkInCount = 0
  monthLogs.forEach((log) => {
    if (log.checkIn && log.checkIn !== '-') {
      const [hh, mm] = log.checkIn.split(':').map(Number)
      if (!isNaN(hh) && !isNaN(mm)) {
        totalCheckInMinutes += hh * 60 + mm
        checkInCount++
      }
    }
  })
  let avgCheckInStr = '-'
  if (checkInCount > 0) {
    const avgMins = Math.floor(totalCheckInMinutes / checkInCount)
    // 格式化為 HH:mm，padStart 確保單數時分有補零
    avgCheckInStr = `${Math.floor(avgMins / 60)
      .toString()
      .padStart(2, '0')}:${(avgMins % 60).toString().padStart(2, '0')}`
  }

  // 統計異常天數（狀態不是「正常」的紀錄）
  const abnormalCount = monthLogs.filter((log) => log.status !== '正常').length

  // 計算加班分鐘數（下班打卡晚於設定下班時間的部分）
  let overtimeMinutes = 0
  const workEndTime = user.work?.workEndTime || '18:00'
  const [targetHH, targetMM] = workEndTime.split(':').map(Number)
  const targetTotal = targetHH * 60 + targetMM

  monthLogs.forEach((log) => {
    if (log.checkOut && log.checkOut !== '-') {
      const [hh, mm] = log.checkOut.split(':').map(Number)
      if (!isNaN(hh) && !isNaN(mm)) {
        const actualTotal = hh * 60 + mm
        if (actualTotal > targetTotal) {
          overtimeMinutes += actualTotal - targetTotal
        }
      }
    }
  })
  const overtimeStr = `${Math.floor(overtimeMinutes / 60)}h ${overtimeMinutes % 60}m`

  return [
    {
      title: '本月累積工時',
      value: totalHoursStr,
      type: 'progress',
      progress: targetTotalMinutes > 0 ? Math.min(totalMinutes / targetTotalMinutes, 1) : 0,
      subtext: `本月目標: ${targetHours}h (${workingDaysCount}工作日)`,
    },
    {
      title: '平均上班時間',
      value: avgCheckInStr,
      type: 'text',
      icon: 'schedule',
      subtext: '本月平均出勤時間',
      subtextColor: 'text-grey-6',
    },
    {
      title: '異常天數 (本月)',
      value: `${abnormalCount} 天`,
      type: 'text',
      icon: abnormalCount > 0 ? 'warning' : 'check_circle',
      subtext: abnormalCount > 0 ? '請留意出勤規範' : '表現優異！',
      subtextColor: abnormalCount > 0 ? 'text-negative' : 'text-positive',
    },
    {
      title: '本月累積加班',
      value: overtimeStr,
      type: 'text',
      icon: 'trending_up',
      subtext: '辛苦了，適度休息',
      subtextColor: 'text-primary',
    },
  ]
})

// 出勤紀錄表格的欄位設定
const columns = [
  { name: 'date', label: '日期', field: 'date', align: 'left', classes: 'text-weight-medium' },
  {
    name: 'checkIn',
    label: '上班打卡時間',
    field: 'checkIn',
    align: 'left',
    classes: 'text-grey-8',
  },
  {
    name: 'checkOut',
    label: '下班打卡時間',
    field: 'checkOut',
    align: 'left',
    classes: 'text-grey-8',
  },
  { name: 'duration', label: '時長', field: 'duration', align: 'left' },
  { name: 'status', label: '狀態', field: 'status', align: 'left' },
  { name: 'leave', label: '請假', field: 'leave', align: 'left' },
]

/**
 * 頁面掛載時初始化：
 * 1. 取得個人請假紀錄（先取得，後續 getAttendance 需要用來標記請假）
 * 2. 取得出勤紀錄
 * 3. 載入台灣假日資料
 * 4. 啟動即時時鐘（每秒更新 now）
 */
onMounted(async () => {
  await fetchMyLeaves()
  await getAttendance()
  loadHolidays(new Date(calendarDate.value).getFullYear())
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

/**
 * 頁面卸載時清除計時器
 * 避免元件銷毀後 setInterval 仍繼續執行（memory leak）
 */
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.border-radius-lg {
  border-radius: 12px;
}
.tracking-wide {
  letter-spacing: 1px;
}
.border-all {
  border: 1px solid #e0e0e0;
}
.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}
.border-top {
  border-top: 1px solid #f0f0f0;
}
.hover-grey:hover {
  background: #f5f5f5;
}
/* 讓週末/假日的日期格子視覺上「變暗」，表示非工作日 */
.opacity-50 {
  opacity: 0.5;
}
/* 今日的日期格子加上主色邊框，方便使用者定位今天 */
.today-border {
  box-shadow: 0 0 0 2px var(--q-primary) !important;
}

/* 移除 borderless-input 的底線樣式 */
:deep(.borderless-input .q-field__control:before) {
  border: none !important;
}
:deep(.borderless-input .q-field__control) {
  background: #f5f6f8;
}

/* 讓表格標頭背景透明，並加底線分隔 */
:deep(.header-transparent thead tr th) {
  background: transparent !important;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}
/* 加大表格行的上下 padding，讓資料更易閱讀 */
:deep(.q-table tbody td) {
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
  padding-top: 16px;
  padding-bottom: 16px;
}
</style>
