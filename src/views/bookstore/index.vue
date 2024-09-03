<script setup lang="ts">
import { onMounted } from 'vue';
import { useScrollTopStore } from '../../store/scrolltop';
import { PagePath } from '../../core/window';

const { pageScrollTop } = useScrollTopStore();
onMounted(() => {
  pageScrollTop(PagePath.BOOKSTORE);
});
</script>

<template>
  <div class="container">书城</div>
</template>

<style scoped lang="scss">

</style>