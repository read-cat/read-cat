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
const { platform } = process;
</script>
<script lang="ts">
export default {
  name: 'ReadState'
}
</script>
<template>
  <div :class="['read-state', platform]">
    <span v-memo="[date]">{{ date }}</span>
    <span v-memo="[readProgress]">已读:<br v-if="platform === 'darwin'">{{ readProgress }}</span>
    <span v-if="textContent" v-memo="[textContent]">字数:<br v-if="platform === 'darwin'">{{ textContent.length }}</span>
  </div>
</template>

<style scoped lang="scss">
.read-state {
  display: flex;
  align-items: center;
  margin-left: 2rem;
  color: var(--rc-text-color);

  span {
    margin-right: 1rem;
    font-size: 1.4rem;

    &:last-child {
      margin-right: 0;
    }


  }

  &:is(.darwin) {
    span {

      &:nth-child(2),
      &:nth-child(3) {
        font-size: 1.2rem;
      }
    }
  }
}
@media screen and (max-width: 800px) {
  .read-state {
    display: none;
  }
}
</style>