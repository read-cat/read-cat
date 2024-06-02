<script setup lang="ts">

defineProps<{
  label: string
}>();

const modelValue = defineModel<string>();

</script>
<script lang="ts">
export default {
  name: 'SettingsNavItem'
}
</script>

<template>
  <li @click="modelValue = label" :class="['rc-button', modelValue === label ? 'settings-nav-item-selected' : '']">
    <slot />
    <span v-once>{{ label }}</span>
  </li>
</template>

<style scoped lang="scss">
li {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  margin-bottom: 5px;
  padding: 5px 10px;
  border-radius: 7px;

  span {
    margin-left: 10px;
    font-size: 14px;
  }

  &:active {
    transform: scale(0.98);
  }
  &:last-child {
    margin-bottom: 0;
  }
}
.settings-nav-item-selected {
  background-color: var(--rc-button-hover-bgcolor);
}
</style>