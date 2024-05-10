<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '../../store/settings';
import IconUpload from '../../assets/svg/icon-upload.svg';
import { ElIcon } from 'element-plus';

withDefaults(defineProps<{
  tip: string
  width?: string
  height?: string
  zIndex?: number
  toBody?: boolean
}>(), {
  width: '100vw',
  height: '100vh',
  zIndex: 990,
  toBody: true
});
const emits = defineEmits<{
  change: [files: File[]]
}>();

const isDrag = ref(false);
const drop = (e: DragEvent) => {
  e.preventDefault();
  isDrag.value = false;
  emits('change', e.dataTransfer ? [...e.dataTransfer.files] : []);
}
const dragover = (e: DragEvent) => {
  e.preventDefault();
}
const dragenter = () => {
  isDrag.value = true;
}
const dragleave = () => {
  isDrag.value = false;
}
const { options } = useSettingsStore();

</script>
<script lang="ts">
export default {
  name: 'FileDrag'
}
</script>

<template>
  <div class="file-drag" @dragenter="dragenter">
    <slot />
    <Teleport to="body" :disabled="!toBody">
      <div class="file-drag-container" v-show="isDrag" @drop="drop" @dragover="dragover" @dragleave="dragleave">
        <Transition :enter-active-class="options.enableTransition ? 'animate__animated animate__fadeIn' : void 0">
          <div v-show="isDrag" :class="[
            'tip',
            options.enableBlur ? 'app-blur' : '',
          ]" :style="{
            backgroundColor: options.enableBlur ? 'var(--rc-window-box-blur-bgcolor)' : 'var(--rc-window-box-bgcolor)',
          }">
            <ElIcon size="40"><IconUpload /></ElIcon>
            <h4 v-html="tip"></h4>
          </div>
        </Transition>
      </div>
    </Teleport>
  </div>
</template>
<style lang="scss">
.file-drag-container {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: v-bind(width);
  height: v-bind(height);
  background-color: transparent;
  z-index: v-bind(zIndex);
  --animate-duration: 0.3s;
  --animate-delay: 0.3s;
  --animate-repeat: 0.3s;

  * {
    pointer-events: none;
  }

  .tip {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 150px;
    height: 150px;
    box-shadow: var(--rc-window-box-shadow);
    border-radius: 10px;
    color: var(--rc-text-color);

    &>h4 {
      margin-top: 10px;
    }
  }
}
</style>