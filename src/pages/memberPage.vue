<!--
  人員管理頁面 (Member Page)

  提供 admin 查看和編輯所有員工資料的介面。
  （此頁面設有 admin: true meta，非 admin 無法進入）

  功能：
  1. 員工列表表格：顯示姓名、信箱、部門、到職日、角色
    - 支援關鍵字搜尋（debounce 500ms 避免頻繁過濾）
    - 支援各欄位排序
  2. 編輯 Dialog：
    - 點擊「編輯」按鈕開啟
    - 可修改：姓名、信箱、部門、到職日、角色、上下班時間
    - 使用 Quasar 的 q-date 和 q-time popup 選擇器
    - 儲存後重新取得列表

  設計說明：
  - filter 搜尋由 q-table 內建的 :filter 屬性處理，
    Quasar 會自動對所有 sortable 欄位做關鍵字過濾
  - openDialog 時深拷貝（JSON.parse/stringify）使用者資料到 form，
    避免在編輯過程中誤改到 users 陣列原始資料
-->
<template>
  <q-page class="q-pa-xl bg-grey-1 text-dark" style="max-width: 1400px; margin: 0 auto">
    <!-- 頁面標題列 -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-weight-bold q-my-none q-mb-xs">人員管理</h1>
        <div class="text-grey-6 text-body1">管理與編輯系統內所有人員資料</div>
      </div>
    </div>

    <q-card flat bordered class="rounded-xl q-mb-xl bg-white">
      <!-- 表格標頭列：搜尋框 -->
      <div class="row items-center justify-between q-pa-md border-bottom bg-white rounded-top-xl">
        <!-- debounce="500"：輸入後延遲 500ms 才觸發 filter，避免每個字母都重繪表格 -->
        <q-input
          v-model="filter"
          dense
          outlined
          debounce="500"
          placeholder="搜尋姓名、信箱或部門..."
          class="col-12 col-md-5 bg-grey-1 search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="sm" class="text-grey-5" />
          </template>
        </q-input>
      </div>

      <!-- 員工列表表格：filter 由 Quasar 自動過濾 sortable 欄位 -->
      <q-table
        :rows="users"
        :columns="columns"
        row-key="_id"
        flat
        :filter="filter"
        class="header-transparent text-body1"
        :loading="loading"
      >
        <!-- 自訂表頭樣式 -->
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-grey-8 text-weight-bold q-py-md"
              :class="`text-${col.align}`"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- 姓名欄：加粗顯示 -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center">
              <span class="text-weight-bold">{{ props.row.name }}</span>
            </div>
          </q-td>
        </template>

        <!-- 部門欄：用 badge 樣式顯示（無部門時顯示「未指派」） -->
        <template v-slot:body-cell-department="props">
          <q-td :props="props" class="text-grey-8">
            <q-badge
              color="grey-2"
              text-color="grey-8"
              class="q-px-sm py-xs text-weight-medium rounded-borders"
            >
              {{ props.row.department || '未指派' }}
            </q-badge>
          </q-td>
        </template>

        <!-- 操作欄：編輯按鈕，點擊開啟編輯 Dialog -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              class="hover-bg"
              @click="openDialog(props.row)"
            >
              <q-tooltip>編輯</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- 編輯員工資料 Dialog -->
    <q-dialog v-model="dialog.open" persistent transition-show="scale" transition-hide="scale">
      <q-card style="width: 600px; max-width: 90vw" class="rounded-xl q-pa-sm">
        <q-form @submit.prevent="submit">
          <!-- Dialog 標頭 -->
          <q-card-section class="row items-center justify-between border-bottom q-pb-md">
            <div class="text-h6 text-weight-bold">
              {{ '編輯資料' }}
            </div>
            <q-btn icon="close" flat round dense v-close-popup class="text-grey-7" />
          </q-card-section>

          <!-- 表單欄位 -->
          <q-card-section class="q-gutter-y-md q-pt-lg">
            <!-- 姓名 -->
            <q-input
              outlined
              v-model="form.name"
              label="姓名"
              :rules="[(val) => !!val || '請輸入姓名']"
            />
            <!-- 信箱 -->
            <q-input
              outlined
              v-model="form.email"
              label="信箱"
              :rules="[(val) => !!val || '請輸入信箱']"
            />
            <!-- 部門 -->
            <q-input
              outlined
              v-model="form.department"
              label="部門"
              :rules="[(val) => !!val || '請輸入部門']"
            />

            <!-- 到職日：用 q-popup-proxy 搭配 q-date 選擇器
                mask="YYYY-MM-DD" 確保日期格式一致 -->
            <q-input
              outlined
              v-model="form.onboardDate"
              label="到職日"
              :rules="[(val) => !!val || '請選擇到職日期']"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer text-primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.onboardDate" mask="YYYY-MM-DD" color="primary">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="確定" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- 身份角色選擇（不包含 admin，admin 只能由資料庫直接修改） -->
            <q-select
              outlined
              v-model="form.role"
              :options="['employee', 'manager']"
              label="身份"
              emit-value
              map-options
              :rules="[(val) => !!val || '請選擇身份']"
            />

            <!-- 上下班時間：用 q-time popup 選擇器，左右各佔一半 -->
            <div class="row q-col-gutter-x-md">
              <q-input
                outlined
                v-model="form.work.workStartTime"
                label="上班時間"
                mask="time"
                :rules="['time']"
                class="col-6"
              >
                <template v-slot:append>
                  <q-icon name="access_time" class="cursor-pointer text-primary">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="form.work.workStartTime" color="primary">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="確定" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <q-input
                outlined
                v-model="form.work.workEndTime"
                label="下班時間"
                mask="time"
                :rules="['time']"
                class="col-6"
              >
                <template v-slot:append>
                  <q-icon name="access_time" class="cursor-pointer text-primary">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="form.work.workEndTime" color="primary">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="確定" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </q-card-section>

          <!-- 底部操作按鈕 -->
          <q-card-actions align="right" class="q-pa-md border-top">
            <q-btn
              flat
              label="取消"
              color="grey-8"
              @click="closeDialog"
              :disable="loading"
              class="rounded-borders q-px-md"
            />
            <q-btn
              type="submit"
              label="儲存"
              color="primary"
              class="rounded-borders q-px-md text-weight-bold"
              :loading="loading"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar, date } from 'quasar'
import serviceUser from 'src/services/user'

const $q = useQuasar()
const users = ref([]) // 員工列表資料
const filter = ref('') // 搜尋關鍵字（q-table 的 :filter）
const loading = ref(false)

// Dialog 狀態：open 控制顯示，id 記錄正在編輯的員工 ID
const dialog = ref({
  open: false,
  id: '',
})

/**
 * 產生空白表單物件
 * 抽取為函式是為了方便重置表單（closeDialog 或新增模式時使用）
 */
const getEmptyForm = () => ({
  name: '',
  email: '',
  department: '',
  onboardDate: '',
  role: '',
  work: {
    workStartTime: '09:00',
    workEndTime: '18:00',
  },
})

const form = ref(getEmptyForm())

// 表格欄位設定
const columns = [
  { name: 'name', label: '姓名', field: 'name', align: 'left', sortable: true },
  {
    name: 'email',
    label: '信箱',
    field: 'email',
    align: 'left',
    sortable: true,
    classes: 'text-grey-7',
  },
  { name: 'department', label: '部門', field: 'department', align: 'left', sortable: true },
  {
    name: 'onboardDate',
    label: '到職日',
    field: 'onboardDate',
    // format 讓 q-table 在顯示此欄時自動格式化 Date 物件為 YYYY-MM-DD 字串
    format: (val) => date.formatDate(val, 'YYYY-MM-DD'),
    align: 'left',
    sortable: true,
    classes: 'text-grey-7',
  },
  { name: 'role', label: '身份', field: 'role', align: 'left', sortable: true },
  { name: 'actions', label: '操作', align: 'left' },
]

// 取得所有員工列表
const getUsers = async () => {
  try {
    loading.value = true
    const { data } = await serviceUser.getUser()
    users.value = data.result
  } catch {
    $q.notify({ message: '取得人員失敗', color: 'negative' })
  } finally {
    loading.value = false
  }
}

// 頁面載入時立即取得資料
getUsers()

/**
 * 開啟編輯 Dialog
 * 用 JSON.parse(JSON.stringify(user)) 深拷貝使用者資料到 form，
 * 避免在輸入框中修改時直接影響 users 陣列（直到點「儲存」才真正更新）。
 * 到職日需要從 ISO 字串轉換為 YYYY-MM-DD 格式（q-date 的格式要求）
 */
const openDialog = (user) => {
  dialog.value.open = true
  if (user) {
    dialog.value.id = user._id

    // 深拷貝避免直接修改 users 陣列
    const tempForm = JSON.parse(JSON.stringify(user))
    if (tempForm.onboardDate) {
      tempForm.onboardDate = date.formatDate(tempForm.onboardDate, 'YYYY-MM-DD')
    }

    form.value = {
      ...tempForm,
      // 確保 work 欄位存在（舊資料可能沒有 work 設定）
      work: tempForm.work || { workStartTime: '09:00', workEndTime: '18:00' },
    }
  } else {
    dialog.value.id = ''
    form.value = getEmptyForm()
  }
}

// 關閉 Dialog
const closeDialog = () => {
  dialog.value.open = false
}

/**
 * 提交表單（更新員工資料）
 * 目前只有「更新」功能（新增由 register 頁面處理）
 * 成功後重新取得列表並關閉 Dialog
 */
const submit = async () => {
  try {
    loading.value = true
    if (dialog.value.id) {
      await serviceUser.updateUser(dialog.value.id, form.value)
      $q.notify({ message: '更新成功', color: 'positive', icon: 'check_circle' })
    }
    closeDialog()
    getUsers()
  } catch (error) {
    console.log(error)
    const message = error?.response?.data?.message || '發生錯誤'
    $q.notify({ message, color: 'negative', icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 圓角設定 */
.rounded-xl {
  border-radius: 16px;
}
.rounded-top-xl {
  border-radius: 16px 16px 0 0;
}
.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}
.border-top {
  border-top: 1px solid #f0f0f0;
}

/* 搜尋框去邊框設計（視覺上融入灰色背景） */
:deep(.search-input .q-field__control:before) {
  border-color: transparent !important;
}
:deep(.search-input .q-field__control) {
  background: #f4f5f7;
  border-radius: 8px;
}

/* 表格標頭透明背景 */
:deep(.header-transparent thead tr th) {
  background: transparent !important;
  border-bottom: 1px solid #f0f0f0;
}

/* 表格行間距 */
:deep(.q-table tbody td) {
  padding-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f8f8f8;
}

/* 編輯按鈕 hover 效果 */
.hover-bg:hover {
  background: #f0f4ff;
}
</style>
