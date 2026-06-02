<!--
  應用根元件 (App Root Component)

  這是整個 Vue 應用的最頂層元件，由 Quasar 的 client-entry.js 掛載到 DOM。
  僅包含 <router-view /> 作為路由出口，讓 Vue Router 負責渲染當前路由對應的元件。

  為什麼這個元件這麼簡單：
  Quasar 建議將佈局（側邊欄、頂部列等）放在 layouts/ 目錄下的元件，
  而非根元件，這樣不同頁面可以有不同的佈局（如登入頁不需要側邊欄，
  但功能頁面需要）。根元件只做路由出口，保持職責單一。
-->
<template>
  <router-view />
</template>

<script setup>
//
</script>
