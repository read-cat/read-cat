<script lang="ts" setup>
import { computed } from 'vue';
import { handlerVueProp } from '../../core/utils';


const props = defineProps<{
  ellipsis?: boolean
  maxWidth?: number | string
  hover?: boolean
  cursor?: 'default' | 'pointer' | 'text'
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
    hover ? 'rc-text-hover' : '',
  ]" :style="{
    maxWidth: _maxWidth || '',
    cursor: cursor || ''
  }">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.rc-text:is(.rc-text-ellipsis) {
  display: inline-block;
  line-height: calc(100% + 5px);
}
.rc-text:is(.rc-text-hover) {
  transition: color .3s ease;
  &:hover {
    color: var(--rc-theme-color);
  }
}
</style>