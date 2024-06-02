<script lang="ts" setup>
import { computed } from 'vue';
import { handlerVueProp } from '../../core/utils';


const props = defineProps<{
  ellipsis?: boolean
  maxWidth?: number | string
}>();

const _maxWidth = computed(() => handlerVueProp(props.maxWidth));

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
  line-height: calc(100% + 5px);
}
</style>