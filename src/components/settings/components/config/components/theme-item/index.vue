<script setup lang="ts">
import { SettingsTheme } from '../../../../../../store/defined/settings';
import ThemeLight from '../../../../../../assets/theme-light.webp';
import ThemeDark from '../../../../../../assets/theme-dark.webp';
import ThemeOs from '../../../../../../assets/theme-os.webp';
const props = defineProps<{
  type: SettingsTheme
}>();
const emits = defineEmits<{
  change: [val: SettingsTheme]
}>();
const onClick = () => {
  modelValue.value = props.type;
  emits('change', props.type);
}
const modelValue = defineModel<SettingsTheme>();
</script>
<script lang="ts">
export default {
  name: 'SettingsThemeItem'
}
</script>

<template>
  <div class="theme-container">
    <div>
      <div v-memo="[modelValue]" :class="[modelValue === type ? 'checked' : '', 'border']" @click="onClick">
        <img v-once v-if="type === 'os'" :src="ThemeOs" />
        <img v-once v-else-if="type === 'light'" :src="ThemeLight" />
        <img v-once v-else-if="type === 'dark'" :src="ThemeDark" />
      </div>
    </div>
    <p v-memo="[modelValue]" :class="[modelValue === type ? 'checked' : '']">{{ type === 'os' ? '跟随系统' : type === 'light' ? '浅色模式' : '深色模式' }}</p>
  </div>

</template>

<style scoped lang="scss">
.theme-container {
  position: relative;

  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &>div {
    width: 90px;
    height: 90px;
    padding: 2px;
    .border {
      padding: 2px;
      border-radius: 19px;
      cursor: pointer;
      img {
        width: 80px;
        height: 80px;
        border-radius: 15px;
      }
    }
  }

  p, .border {
    transition: all 0.1s ease;
  }
  p {
    font-size: 13px;
    text-align: center;
  }

  .border.checked {
    border: 2px solid var(--rc-theme-color);
  }

  p.checked {
    color: var(--rc-theme-color);
  }
}
</style>