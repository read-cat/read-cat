<script setup lang="ts">
import {
  ElButton
} from 'element-plus';
import { onMounted } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { EventCode } from '../../../events';
import { PagePath } from '../../core/window';
const { pageScrollTop } = useScrollTopStore();
onMounted(() => {
  pageScrollTop(PagePath.HOME);
});

const full = () => {
  GLOBAL_IPC.send(EventCode.ASYNC_WINDOW_SET_FULLSCREEN, true);
}
</script>

<template>
  <div id="home" class="container">
    <ElButton @click="full">全屏</ElButton>
    <div>home</div>
  </div>
</template>

<style scoped></style>