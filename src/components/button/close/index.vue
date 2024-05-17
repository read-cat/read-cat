<script lang="ts" setup>
import { ref, watch } from 'vue';
import IconClose from '../../../assets/svg/icon-close.svg';
import { handlerVueProp } from '../../../core/utils';

const props = defineProps<{
  marginRight?: number | string
}>();

const _marginRight = ref('');
watch(() => props, newVal => {
  const { marginRight } = newVal;
  _marginRight.value = handlerVueProp(marginRight);
}, {
  immediate: true
});

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