<!--
  主要佈局元件 (Main Layout)

  提供所有功能頁面共用的外殼結構，包含：
  - q-header：頂部列（只在小螢幕顯示，含漢堡選單按鈕）
  - q-drawer：左側導覽抽屜（大螢幕固定顯示，小螢幕隱藏需點選漢堡開啟）
    - 系統 Logo 與名稱
    - 導覽連結列表（依登入狀態與角色動態顯示）
    - 登出按鈕
    - 使用者頭像區（點擊開啟個人資料 Dialog）
  - q-page-container：各頁面的渲染區域（<router-view />）

  設計說明：
  - 導覽連結用 computed 動態產生，讓 admin 才看到人員管理和註冊
  - 頭像圖片用 DiceBear API 根據 account 帳號產生唯一的 SVG 頭像，
    不需要使用者上傳照片
  - 個人資料 Dialog 提供快速查看個人基本資訊的入口
-->
<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <!-- 頂部列：只在小螢幕（lt-md）顯示漢堡選單按鈕，大螢幕因 drawer 固定顯示不需要 -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="q-px-lg">
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="lt-md q-mr-sm"
          color="white"
          @click="toggleLeftDrawer"
        />
      </q-toolbar>
    </q-header>

    <!-- 左側導覽抽屜：
        show-if-above 讓它在大螢幕上自動固定顯示（不需要手動開啟）
        v-model="leftDrawer" 控制小螢幕的顯示/隱藏
        width="240" 固定寬度 240px -->
    <q-drawer show-if-above v-model="leftDrawer" side="left" bordered :width="240">
      <div class="column full-height">
        <div class="q-pa-md q-gutter-md col">
          <!-- 系統 Logo 與名稱區 -->
          <div class="row items-center q-gutter-sm q-mb-xl">
            <q-avatar color="primary" text-color="white" icon="business" rounded />
            <div class="text-weight-bold">出勤管理系統</div>
          </div>

          <!-- 導覽連結列表：只顯示 nav.show 為 true 的項目（根據角色動態過濾） -->
          <q-list transparent class="q-px-sm">
            <template v-for="nav in navs" :key="nav.to">
              <q-item
                v-if="nav.show"
                clickable
                v-ripple
                :to="nav.to"
                exact
                active-class="text-primary bg-blue-1 rounded-borders"
              >
                <q-item-section avatar>
                  <q-icon :name="nav.icon" />
                </q-item-section>
                <q-item-section>
                  {{ nav.title }}
                </q-item-section>
              </q-item>
            </template>

            <!-- 登出按鈕：只在已登入時顯示，點擊後呼叫 logout() -->
            <q-item v-if="user.isLoggedIn" clickable v-ripple @click="logout" class="text-red">
              <q-item-section avatar>
                <q-icon name="mdi-logout" />
              </q-item-section>
              <q-item-section>登出</q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- 使用者頭像區（固定在抽屜底部）：點擊開啟個人資料 Dialog -->
        <div>
          <div
            v-if="user.isLoggedIn"
            class="q-pa-md border-top cursor-pointer hover-bg"
            v-ripple
            @click="profileDialog = true"
          >
            <div class="row items-center">
              <!-- DiceBear API：根據帳號名稱產生唯一的 thumbs 風格 SVG 頭像
                   好處：不需要使用者上傳照片，每個帳號有固定且獨特的頭像 -->
              <q-avatar size="40px" class="q-mr-md">
                <img :src="`https://api.dicebear.com/9.x/thumbs/svg?seed=${user.account}`" />
              </q-avatar>
              <div>
                <div class="text-weight-bold text-body2">{{ user.name }}</div>
              </div>
            </div>
          </div>

          <!-- 個人資料 Dialog：點擊頭像區後顯示，transition-show/hide 加上縮放動畫 -->
          <q-dialog v-model="profileDialog" transition-show="scale" transition-hide="scale">
            <q-card style="width: 1000px; max-width: 95vw" class="rounded-xl q-pa-md">
              <div class="row justify-end q-pb-sm z-top">
                <q-btn
                  icon="close"
                  flat
                  round
                  dense
                  v-close-popup
                  class="bg-white text-grey-8 shadow-1"
                />
              </div>

              <div class="bg-white rounded-xl q-pa-lg">
                <div
                  class="text-subtitle1 text-weight-bold row items-center q-mb-lg justify-between"
                >
                  <div class="row items-center">
                    <q-icon name="person" color="primary" size="sm" class="q-mr-sm" />
                    個人資料
                  </div>
                </div>

                <!-- 個人資料欄位：用 col-12 col-sm-6 在不同螢幕寬度下自動換行 -->
                <div class="row q-col-gutter-y-lg q-col-gutter-x-md">
                  <div class="col-12 col-sm-6">
                    <div
                      class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wide q-mb-xs"
                    >
                      姓名
                    </div>
                    <div class="text-body1 text-weight-medium">
                      {{ user.name || '未填寫' }}
                    </div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div
                      class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wide q-mb-xs"
                    >
                      信箱
                    </div>
                    <div class="text-body1 text-weight-medium">
                      {{ user.email || '未填寫' }}
                    </div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div
                      class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wide q-mb-xs"
                    >
                      部門
                    </div>
                    <div class="text-body1 text-weight-medium">
                      {{ user.department || '未填寫' }}
                    </div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div
                      class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wide q-mb-xs"
                    >
                      到職日
                    </div>
                    <div class="text-body1 text-weight-medium">
                      {{ formattedOnboardDate }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </q-drawer>

    <!-- 頁面內容渲染區：各子頁面元件在此渲染 -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from 'src/stores/user'
import serviceUser from 'src/services/user'
import { useRouter } from 'vue-router'
import { date } from 'quasar'

const router = useRouter()
const user = useUserStore()

// 控制左側抽屜的開/關（小螢幕使用）
const leftDrawer = ref(false)

// 控制個人資料 Dialog 的顯示
const profileDialog = ref(false)

// 格式化到職日顯示（Date 物件 → YYYY-MM-DD 字串）
const formattedOnboardDate = computed(() => {
  return user.onboardDate ? date.formatDate(user.onboardDate, 'YYYY-MM-DD') : '未填寫'
})

// 切換抽屜開/關（小螢幕漢堡按鈕用）
const toggleLeftDrawer = () => {
  leftDrawer.value = !leftDrawer.value
}

/**
 * 導覽連結清單（computed）
 * 根據登入角色動態決定顯示哪些連結：
 * - 人員管理、註冊頁面只有 admin 才看得到（show: user.isAdmin）
 * - 出勤狀態和請假申請所有登入者都能看到（show: true）
 */
const navs = computed(() => [
  { title: '出勤狀態', to: '/attendance', icon: 'event_available', show: true },
  { title: '請假申請', to: '/leaveRequest', icon: 'assignment_late', show: true },
  { title: '人員管理', to: '/member', icon: 'manage_accounts', show: user.isAdmin },
  { title: '註冊', to: '/register', icon: 'person_add', show: user.isAdmin },
])

/**
 * 登出處理函式
 * 1. 呼叫後端 API 移除 token（即使失敗也繼續，確保前端一定能登出）
 * 2. 清空 Pinia store 的使用者狀態
 * 3. 導向登入頁
 *
 * 為什麼 catch 後還是繼續登出：
 * 若後端已無此 token（如 token 過期），API 會失敗，
 * 但使用者仍應能成功登出前端，清除 localStorage 中的 token。
 */
const logout = async () => {
  try {
    await serviceUser.logout()
  } catch (error) {
    console.log(error)
  }
  user.logout()
  router.push('/')
}
</script>

<style scoped>
/* 使用者頭像區上方的分隔線 */
.border-top {
  border-top: 1px solid #f0f0f0;
}

/* 頭像區 hover 效果，讓使用者知道可以點擊 */
.hover-bg:hover {
  background: #f5f5f5;
  transition: background 0.3s;
}

/* Dialog 卡片的圓角樣式 */
.rounded-xl {
  border-radius: 16px;
}

/* 個人資料欄位標籤的字距微調，讓大寫字母看起來更清晰 */
.tracking-wide {
  letter-spacing: 0.5px;
}

/* 確保關閉按鈕在最上層，不被其他元素遮住 */
.z-top {
  z-index: 10;
}
</style>
