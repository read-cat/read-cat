<script setup lang="ts">
import { useRouter } from 'vue-router';


defineProps<{
  path: string
}>();
const router = useRouter();
</script>
<script lang="ts">
export default {
  name: 'Navigation'
}
</script>
<template>
  <nav class="container">
    <ul>
      <li v-memo="[path]" :class="[path === '/home' ? 'li-selected' : 'rc-button']"
        @click="router.push('/home')">首页</li>
      <li v-memo="[path]" :class="[path === '/bookshelf' ? 'li-selected' : 'rc-button']"
        @click="router.push('/bookshelf')">书架</li>
      <li v-memo="[path]" :class="[path === '/bookstore' ? 'li-selected' : 'rc-button']"
        @click="router.push('/bookstore')">书城</li>
    </ul>
  </nav>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 15px;

  ul {
    display: flex;
    align-items: center;
    font-size: 14px;

    li {
      padding: 4px 8px;
      margin-right: 3px;
      color: var(--rc-text-color);
      font-weight: bold;

      &:last-child {
        margin: 0;
      }
    }
  }
}
</style>