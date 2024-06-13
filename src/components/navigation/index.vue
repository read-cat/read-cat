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
      <li v-memo="[path]" :class="[path === '/bookstore' ? 'li-selected' : 'rc-button']"
        @click="router.push('/bookstore')">书城</li>
      <li v-memo="[path]" :class="[path === '/bookshelf' ? 'li-selected' : 'rc-button']"
        @click="router.push('/bookshelf')">书架</li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 1.5rem;

  ul {
    display: flex;
    align-items: center;
    font-size: 1.4rem;

    li {
      padding: .4rem .8rem;
      margin-right: .3rem;
      color: var(--rc-text-color);
      font-weight: bold;

      &:last-child {
        margin: 0;
      }
    }
  }
}
</style>