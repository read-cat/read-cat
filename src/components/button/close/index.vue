<script lang="ts" setup>
import { computed } from 'vue';
import IconClose from '../../../assets/svg/icon-close.svg';
import { handlerVueProp } from '../../../core/utils';

const props = defineProps<{
  marginRight?: number | string
}>();

const _marginRight = computed(() => handlerVueProp(props.marginRight));

</script>
<script lang="ts">
export default {
  name: 'CloseButton'
}
</script>
<template>
  <button title="关闭" v-once class="close-button">
    <IconClose />
  </button>
</template>

<style lang="scss" scoped>
.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: v-bind(_marginRight);
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
  border-radius: 5px;
  color: var(--rc-text-color);
  cursor: pointer;

  &:hover {
    color: #FFFFFF;
    background-color: var(--rc-window-close-btn-color);
  }

  &:active {
    transform: scale(0.85);
  }
}
</style>