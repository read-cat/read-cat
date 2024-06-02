<script setup lang="ts">
import IconHelp from '../../../../assets/svg/icon-help.svg';
import {
  ElDivider,
  ElPopover,
  ElIcon
} from 'element-plus';
defineProps<{
  title?: string,
  help?: string
}>();

</script>
<script lang="ts">
export default {
  name: 'SettingsCard'
}
</script>

<template>
  <div class="settings-card">
    <header v-if="title" class="is-prop">
      <span>{{ title }}</span>
      <ElPopover v-once v-if="help" placement="bottom-start" popper-class="settings-help" trigger="hover" :width="350"
        title="提示" :persistent="false">
        <template #reference>
          <ElIcon>
            <IconHelp />
          </ElIcon>
        </template>
        <template #default>
          <div v-html="help" class="help-content"></div>
        </template>
      </ElPopover>
    </header>
    <header v-else class="is-slot">
      <slot name="header" />
    </header>
    <ElDivider v-once />
    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.settings-card {
  margin-bottom: 10px;
  padding: 10px;
  font-size: 14px;
  width: calc(100% - 40px);
  border-radius: 10px;
  background-color: var(--rc-card-bgcolor);

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-divider) {
    margin: 10px 0;
  }

  header {

    &.is-prop {
      display: flex;
      align-items: center;

      span {
        margin-right: 5px;
      }

      font-weight: bold;
    }

    &.is-slot {
      display: flex;
      align-items: center;
      justify-content: space-between;

      :deep(.title) {
        font-weight: bold;
      }
    }
  }
}
</style>