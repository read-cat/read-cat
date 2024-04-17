<script setup lang="ts">

withDefaults(defineProps<{
  label: string
  bottom?: string
}>(), {
  bottom: '5px'
});

</script>
<script lang="ts">
export default {
  name: 'MenuItem'
}
</script>

<template>
  <div class="menu-item" v-once>
    <slot name="icon" />
    <span>{{ label }}</span>
  </div>
</template>

<style scoped lang="scss">
.menu-item {
  display: flex;
  align-items: center;
  margin-bottom: v-bind(bottom);
  padding: 2px 5px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 5px;

  &:hover {
    background-color: var(--rc-menu-item-hover-bgcolor);
  }
  &:active {
    transform: scale(0.97);
  }
  &:last-child {
    margin-bottom: 0;
  }
  i+span {
    margin-left: 5px;
  }

  span {
    min-width: 100px;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
  }
}
</style>