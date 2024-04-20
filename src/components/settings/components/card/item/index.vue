<script setup lang="ts">
import {
  ElPopover,
  ElIcon
} from 'element-plus';
import IconHelp from '../../../../../assets/svg/icon-help.svg';
import { isUndefined } from '../../../../../core/is';

defineProps<{
  title?: string
  help?: string
  className?: string
}>();

</script>
<script lang="ts">
export default {
  name: 'SettingsCardItem'
}
</script>

<template>
  <div class="settings-card-item">
    <div>
      <span v-if="!isUndefined(title)" v-once>{{ title }}</span>
      <ElPopover v-once v-if="help" placement="bottom-start" popper-class="settings-help" trigger="hover" :width="350" title="提示">
        <template #reference>
          <ElIcon>
            <IconHelp />
          </ElIcon>
        </template>
        <template #default>
          <div v-html="help" class="help-content"></div>
        </template>
      </ElPopover>
    </div>
    <div :class="[className ? className : '']">
      <slot />
    </div>
  </div>
</template>
<style scoped lang="scss">
.settings-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  div:nth-child(1) {
    display: flex;
    align-items: center;
    
    span {
      margin-right: 5px;
    }
  }

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-popper) {
    .el-popover__title {
      font-size: 15px;
    }
  }
}
</style>