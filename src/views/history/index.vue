<script setup lang="ts">
import { onMounted } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { PagePath } from '../../core/window';


const { pageScrollTop } = useScrollTopStore();
onMounted(() => {
  pageScrollTop(PagePath.HISTORY);
});
</script>

<template>
  <div class="container">
    历史记录
  </div>
</template>

<style scoped>
.container {

}
</style>