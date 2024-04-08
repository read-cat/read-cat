<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { format } from '../../core/utils/date';
import { interval } from '../../core/utils/timer';

const date = ref('');
const timer = interval(() => {
  date.value = format(Date.now(), 'HH:mm');
}, 3000);
timer.executor();
timer.start();

onUnmounted(() => {
  timer.stop();
});
</script>
<script lang="ts">
export default {
  name: 'Timer'
}
</script>
<template>
  <div class="container" v-memo="[date]">
    <span>{{ date }}</span>
  </div>
</template>

<style scoped>
.container {
  margin-left: 20px;
  color: var(--rc-text-color);

  span {
    font-size: 14px;
  }
}
</style>