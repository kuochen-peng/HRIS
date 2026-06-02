<!--
  請假申請管理頁面 (Leave Request Page)

  根據登入者的角色顯示不同範圍的假單：
  - employee → 只看到自己的申請（getMyLeaveRequest）
  - manager / admin → 看到所有員工的申請（getAllLeaveRequest）

  功能區塊：
  1. 搜尋列：依員工姓名或假別關鍵字過濾
  2. 狀態篩選按鈕：全部 / 待審核 / 已同意 / 已駁回 / 已撤銷
  3. 請假申請表格：
    - 員工姓名、假別、期間/時數、備註/附件、狀態、操作按鈕
  4. 操作邏輯（依角色不同）：
    - manager/admin：可「同意」「駁回」「撤銷」任何申請
    - employee：只能「撤銷申請」自己待審核的申請
  5. 附件預覽 Dialog：點擊縮圖後放大顯示圖片
  6. 撤銷確認 Dialog：防止誤操作

  設計說明：
  - filteredRequests 是 computed，搜尋和篩選不需要重新呼叫 API，
    直接在前端過濾 leaveRequests 陣列，讓 UX 更即時
-->
<template>
  <q-page class="bg-grey-1">
    <div class="q-pa-xl">
      <!-- 搜尋列 + 狀態篩選按鈕列 -->
      <div class="row justify-between items-center q-mb-lg">
        <!-- 搜尋框：同時搜尋員工姓名和假別 -->
        <q-input
          outlined
          v-model="searchQuery"
          placeholder="搜尋員工或假別..."
          class="bg-white col-12 col-md-5 search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" class="text-grey-6" />
          </template>
        </q-input>

        <!-- 狀態篩選按鈕：當前選中的狀態用深色顯示 -->
        <div class="q-gutter-sm q-mt-md q-mt-md-none">
          <q-btn
            unelevated
            rounded
            :color="filterStatus === '全部' ? 'blue-6' : 'grey-4'"
            :text-color="filterStatus === '全部' ? 'white' : 'grey-8'"
            label="全部"
            class="q-px-lg text-weight-bold"
            @click="filterStatus = '全部'"
          />
          <q-btn
            unelevated
            rounded
            :color="filterStatus === '待審核' ? 'orange-6' : 'grey-4'"
            :text-color="filterStatus === '待審核' ? 'white' : 'grey-8'"
            label="待審核"
            class="q-px-lg text-weight-bold"
            @click="filterStatus = '待審核'"
          />
          <q-btn
            unelevated
            rounded
            :color="filterStatus === '已同意' ? 'green-6' : 'grey-4'"
            :text-color="filterStatus === '已同意' ? 'white' : 'grey-8'"
            label="已同意"
            class="q-px-lg text-weight-bold"
            @click="filterStatus = '已同意'"
          />
          <q-btn
            unelevated
            rounded
            :color="filterStatus === '已駁回' ? 'red-6' : 'grey-4'"
            :text-color="filterStatus === '已駁回' ? 'white' : 'grey-8'"
            label="已駁回"
            class="q-px-lg text-weight-bold"
            @click="filterStatus = '已駁回'"
          />
          <q-btn
            unelevated
            rounded
            :color="filterStatus === '已撤銷' ? 'grey-7' : 'grey-4'"
            :text-color="filterStatus === '已撤銷' ? 'white' : 'grey-8'"
            label="已撤銷"
            class="q-px-lg text-weight-bold"
            @click="filterStatus = '已撤銷'"
          />
        </div>
      </div>

      <!-- 請假申請表格 -->
      <q-card flat bordered class="rounded-borders-xl overflow-hidden">
        <q-table
          :rows="filteredRequests"
          :columns="columns"
          row-key="_id"
          flat
          :loading="loading"
          class="custom-table"
        >
          <!-- 員工姓名欄（populate 後從 user.name 取） -->
          <template v-slot:body-cell-employee="props">
            <q-td :props="props">
              <div class="row items-center">
                <div>
                  <div class="text-weight-bold text-grey-9 text-body2">
                    {{ props.row.user?.name }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- 期間/時數欄：顯示開始~結束日期與總時數 -->
          <template v-slot:body-cell-duration="props">
            <q-td :props="props">
              <div class="text-weight-bold text-grey-9">
                {{ date.formatDate(props.row.startTime, 'MM - DD') }} -
                {{ date.formatDate(props.row.endTime, 'MM - DD') }}
              </div>
              <div class="text-grey-5 text-caption">{{ props.row.totalHours }} 小時</div>
            </q-td>
          </template>

          <!-- 備註/附件欄：顯示備註文字與附件縮圖
              縮圖點擊後開啟 imageDialog 放大預覽 -->
          <template v-slot:body-cell-reason="props">
            <q-td :props="props">
              <div class="text-grey-7 ellipsis text-body2" style="max-width: 280px">
                {{ props.row.comment || '' }}
              </div>
              <div v-if="props.row.attachment" class="q-mt-sm">
                <q-img
                  :src="props.row.attachment"
                  style="width: 60px; height: 60px"
                  fit="cover"
                  class="rounded-borders cursor-pointer"
                  @click="viewImage(props.row.attachment)"
                >
                  <!-- 圖片載入失敗時顯示的替代內容（Cloudinary URL 無法存取時） -->
                  <template v-slot:error>
                    <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                      <q-icon name="broken_image" size="24px" />
                    </div>
                  </template>
                </q-img>
              </div>
            </q-td>
          </template>

          <!-- 狀態欄：用 chip 加上圖示顯示狀態 -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="getStatusColor(props.row.status)"
                text-color="white"
                class="text-weight-bold q-px-sm"
              >
                <q-avatar :icon="getStatusIcon(props.row.status)" size="16px" />
                {{ props.row.status }}
              </q-chip>
            </q-td>
          </template>

          <!-- 操作欄：依角色顯示不同按鈕 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <div class="q-gutter-x-sm">
                <!-- manager 或 admin 的操作按鈕 -->
                <template v-if="user.role === 'admin' || user.role === 'manager'">
                  <!-- 待審核狀態才顯示同意和駁回按鈕 -->
                  <template v-if="props.row.status === '待審核'">
                    <q-btn
                      unelevated
                      color="teal-6"
                      label="同意"
                      size="sm"
                      class="text-weight-bold q-px-md rounded-borders"
                      @click="updateRequestStatus(props.row._id, '已同意')"
                    />
                    <q-btn
                      unelevated
                      color="red-6"
                      label="駁回"
                      size="sm"
                      class="text-weight-bold q-px-md rounded-borders"
                      @click="updateRequestStatus(props.row._id, '已駁回')"
                    />
                  </template>
                  <!-- 非已撤銷狀態才顯示撤銷按鈕 -->
                  <q-btn
                    v-if="props.row.status !== '已撤銷'"
                    outline
                    color="grey-7"
                    label="撤銷"
                    size="sm"
                    class="text-weight-bold q-px-md rounded-borders"
                    @click="confirmCancel(props.row._id)"
                  />
                </template>

                <!-- 一般員工只能撤銷自己待審核的申請 -->
                <template v-else>
                  <q-btn
                    v-if="props.row.status === '待審核'"
                    outline
                    color="grey-7"
                    label="撤銷申請"
                    size="sm"
                    class="text-weight-bold q-px-md rounded-borders"
                    @click="confirmCancel(props.row._id)"
                  />
                </template>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 附件放大預覽 Dialog -->
    <q-dialog v-model="imageDialog.show">
      <q-card style="min-width: 350px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">附件預覽</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md text-center">
          <q-img
            :src="imageDialog.url"
            style="max-height: 70vh; object-fit: contain"
            class="rounded-borders"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar, date } from 'quasar'
import { useUserStore } from 'src/stores/user'
import serviceLeaveRequest from 'src/services/leaveRequest'

const $q = useQuasar()
const user = useUserStore()

const loading = ref(false)
const searchQuery = ref('') // 搜尋關鍵字
const filterStatus = ref('全部') // 目前選中的狀態篩選
const leaveRequests = ref([]) // 所有假單原始資料（API 回傳）
const imageDialog = ref({
  show: false,
  url: '', // 當前預覽的附件 URL
})

// 表格欄位設定
const columns = [
  {
    name: 'user',
    label: '員工姓名',
    align: 'left',
    field: (row) => row.user?.name,
    sortable: true,
    headerClasses: 'text-grey-5 text-weight-bold text-caption',
  },
  {
    name: 'leaveType',
    label: '假別',
    align: 'left',
    field: 'leaveType',
    sortable: true,
    headerClasses: 'text-grey-5 text-weight-bold text-caption',
  },
  {
    name: 'duration',
    label: '期間 / 時數',
    align: 'left',
    field: 'duration',
    sortable: true,
    headerClasses: 'text-grey-5 text-weight-bold text-caption',
  },
  {
    name: 'comment',
    label: '備註 / 原因',
    align: 'left',
    field: 'comment',
    headerClasses: 'text-grey-5 text-weight-bold text-caption',
  },
  {
    name: 'status',
    label: '狀態',
    align: 'left',
    field: 'status',
    sortable: true,
    headerClasses: 'text-grey-5 text-weight-bold text-caption',
  },
  { name: 'actions', label: '操作', align: 'cneter', field: 'actions' },
]

/**
 * 過濾後的假單清單（computed）
 * 同時套用搜尋關鍵字過濾和狀態篩選，
 * 不需要重新呼叫 API，提升 UX 流暢度。
 */
const filteredRequests = computed(() => {
  return leaveRequests.value.filter((r) => {
    // 搜尋：姓名或假別包含關鍵字（大小寫不敏感）
    const matchSearch =
      r.user?.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.leaveType?.toLowerCase().includes(searchQuery.value.toLowerCase())

    // 狀態篩選：「全部」時不過濾
    const matchStatus = filterStatus.value === '全部' || r.status === filterStatus.value

    return matchSearch && matchStatus
  })
})

/**
 * 取得假單清單
 * 根據角色決定呼叫哪個 API：
 * - employee → 只取自己的（getMyLeaveRequest）
 * - manager/admin → 取所有人的（getAllLeaveRequest）
 */
const fetchRequests = async () => {
  try {
    loading.value = true
    const { data } =
      user.role === 'employee'
        ? await serviceLeaveRequest.getMyLeaveRequest()
        : await serviceLeaveRequest.getAllLeaveRequest()
    leaveRequests.value = data.result
  } catch (error) {
    console.error('Fetch error:', error)
    $q.notify({ message: '取得資料失敗', color: 'negative' })
  } finally {
    loading.value = false
  }
}

// 頁面載入時立即取得資料（不用 onMounted，直接在 setup 執行）
fetchRequests()

/**
 * 更新假單狀態（審核或撤銷）
 * 更新後重新取得清單確保資料一致
 */
const updateRequestStatus = async (id, status) => {
  try {
    await serviceLeaveRequest.updateStatus(id, status)
    $q.notify({ message: `已將狀態更新為 ${status}`, color: 'positive' })
    fetchRequests()
  } catch (error) {
    console.error('Update status error:', error)
    $q.notify({ message: '操作失敗', color: 'negative' })
  }
}

/**
 * 撤銷確認 Dialog
 * 使用 $q.dialog 顯示確認框，防止誤點「撤銷」
 * 只有點擊「確定撤銷」才真正執行撤銷
 */
const confirmCancel = (id) => {
  $q.dialog({
    title: '撤銷申請',
    message: '確定要撤銷此請假申請嗎？',
    cancel: true,
    persistent: true, // 點擊遮罩不關閉
    ok: {
      label: '確定撤銷',
      color: 'grey-7',
      unelevated: true,
    },
  }).onOk(() => {
    updateRequestStatus(id, '已撤銷')
  })
}

// 狀態對應顏色（給 q-chip 的 color 屬性）
const getStatusColor = (status) => {
  const map = { 待審核: 'orange-6', 已同意: 'green-6', 已駁回: 'red-6', 已撤銷: 'grey-7' }
  return map[status] || 'grey-6'
}

// 狀態對應圖示（給 q-avatar 的 icon 屬性）
const getStatusIcon = (status) => {
  const map = { 待審核: 'schedule', 已同意: 'check_circle', 已駁回: 'cancel', 已撤銷: 'block' }
  return map[status] || 'help'
}

// 開啟附件放大預覽
const viewImage = (url) => {
  imageDialog.value.url = url
  imageDialog.value.show = true
}
</script>

<style scoped>
/* 圓角設定 */
.rounded-borders-xl {
  border-radius: 16px;
}
.tracking-wide {
  letter-spacing: 0.05em;
}

/* 搜尋框客製化，消除預設底色並加強圓角 */
.search-input :deep(.q-field__control) {
  border-radius: 8px;
}

/* 表格標頭樣式：白底、底線分隔，加大 padding */
.custom-table :deep(thead tr th) {
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  padding-top: 16px;
  padding-bottom: 16px;
}

/* 表格資料列加大 padding，讓資料更易閱讀 */
.custom-table :deep(tbody tr td) {
  padding-top: 20px;
  padding-bottom: 20px;
}
</style>
