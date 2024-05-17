<script lang="ts" setup>
import { ref, watch } from 'vue';
import { handlerVueProp } from '../../core/utils';


const props = defineProps<{
  ellipsis?: boolean
  maxWidth?: number | string
}>();

const _maxWidth = ref('');
watch(() => props, newVal => {
  const { maxWidth } = newVal;
  _maxWidth.value = handlerVueProp(maxWidth);
}, { immediate: true });

</script>
<script lang="ts">
export default {
  name: 'Text'
}
</script>

<template>
  <span :class="[
    'rc-text',
    ellipsis ? 'rc-text-ellipsis' : '',
  ]" :style="{
    maxWidth: _maxWidth ? _maxWidth : ''
  }">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.rc-text:is(.rc-text-ellipsis) {
  display: inline-block;
  line-height: 100%;
}
</style>