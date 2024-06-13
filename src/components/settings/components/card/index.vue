<script setup lang="ts">
import { computed } from 'vue';
import IconHelp from '../../../../assets/svg/icon-help.svg';
import {
  ElDivider,
  ElPopover,
  ElIcon
} from 'element-plus';
import { isUndefined } from '../../../../core/is';
const props = defineProps<{
  title?: string,
  help?: string,
  sticky?: number
}>();

const _position = computed(() => isUndefined(props.sticky) ? '' : 'sticky');
const _sticky = computed(() => isUndefined(props.sticky) ? '' : `${props.sticky}px`);
</script>
<script lang="ts">
export default {
  name: 'SettingsCard'
}
</script>

<template>
  <div class="settings-card">
    <header v-if="title" class="is-prop" :style="{
      backgroundColor: _position ? 'var(--rc-card-bgcolor)' : ''
    }">
      <div class="title-bar">
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
      </div>
      <ElDivider v-once />
    </header>
    <header v-else class="is-slot" :style="{
      backgroundColor: _position ? 'var(--rc-card-bgcolor)' : ''
    }">
      <div class="title-bar">
        <slot name="header" />
      </div>
      <ElDivider v-once />
    </header>
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
    position: v-bind(_position);
    top: v-bind(_sticky);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    &.is-prop {

      .title-bar {
        display: flex;
        align-items: center;

        span {
          margin-right: 5px;
        }

        font-weight: bold;
      }
      
    }

    &.is-slot {
      
      .title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;

        :deep(.title) {
          font-weight: bold;
        }
      }
    }
  }
}
</style>