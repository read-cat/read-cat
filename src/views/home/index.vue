<script setup lang="ts">
import { onMounted } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { PagePath } from '../../core/window';
const { pageScrollTop } = useScrollTopStore();
onMounted(() => {
  pageScrollTop(PagePath.HOME);
});

</script>

<template>
  <div id="home" class="container">
    <div>home</div>
  </div>
</template>

<style scoped></style>