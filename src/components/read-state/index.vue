<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { format } from '../../core/utils/date';
import { interval } from '../../core/utils/timer';
import { storeToRefs } from 'pinia';
import { useTextContentStore } from '../../store/text-content';
import { useWindowStore } from '../../store/window';

const date = ref('');
const timer = interval(() => {
  date.value = format(Date.now(), 'HH:mm');
}, 3000);
timer.executor();
timer.start();

onUnmounted(() => {
  timer.stop();
});

const { readProgress } = storeToRefs(useWindowStore());
const { textContent } = storeToRefs(useTextContentStore());
</script>
<script lang="ts">
export default {
  name: 'ReadState'
}
</script>
<template>
  <div class="read-state app-no-drag">
    <span v-memo="[date]">{{ date }}</span>
    <span v-memo="[readProgress]">已读:{{ readProgress }}</span>
    <span v-memo="[textContent]">字数:{{ textContent?.length }}</span>
  </div>
</template>

<style scoped>
.read-state {
  display: flex;
  align-items: center;
  margin-left: 20px;
  color: var(--rc-text-color);

  span {
    margin-right: 10px;
    font-size: 14px;

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>