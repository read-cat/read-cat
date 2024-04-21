<script setup lang="ts">
import {
  ElInput,
} from 'element-plus';
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { useListener } from './hooks/listener';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../../store/window';

const { shortcutKey } = useSettingsStore();
const { globalShortcutKeyRegisterError } = storeToRefs(useWindowStore());
const {
  prevChapterListener,
  nextChapterListener,
  openDevToolsListener,
  zoomInWindowListener,
  zoomOutWindowListener,
  zoomRestWindowListener,
  bossKeyListener
} = useListener();
</script>
<script lang="ts">
export default {
  name: 'SettingsShortcutKey'
}
</script>

<template>
  <div class="settings-shortcut-key">
    <SettingsCard title="应用" help="应用快捷键只在应用窗口获得焦点时生效">
      <SettingsCardItem title="上一章" v-memo="[shortcutKey.prevChapter]">
        <ElInput v-model="shortcutKey.prevChapter" readonly @keydown="prevChapterListener" />
      </SettingsCardItem>
      <SettingsCardItem title="下一章" v-memo="[shortcutKey.nextChapter]">
        <ElInput v-model="shortcutKey.nextChapter" readonly @keydown="nextChapterListener" />
      </SettingsCardItem>
      <SettingsCardItem title="打开控制台" v-memo="[shortcutKey.openDevTools]">
        <ElInput v-model="shortcutKey.openDevTools" readonly @keydown="openDevToolsListener" />
      </SettingsCardItem>
      <SettingsCardItem title="放大" v-memo="[shortcutKey.zoomInWindow]">
        <ElInput v-model="shortcutKey.zoomInWindow" readonly @keydown="zoomInWindowListener" />
      </SettingsCardItem>
      <SettingsCardItem title="缩小" v-memo="[shortcutKey.zoomOutWindow]">
        <ElInput v-model="shortcutKey.zoomOutWindow" readonly @keydown="zoomOutWindowListener" />
      </SettingsCardItem>
      <SettingsCardItem title="重置缩放" v-memo="[shortcutKey.zoomRestWindow]">
        <ElInput v-model="shortcutKey.zoomRestWindow" readonly @keydown="zoomRestWindowListener" />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard title="全局">
      <SettingsCardItem title="老板键" v-memo="[shortcutKey.globalBossKey, globalShortcutKeyRegisterError.get('globalBossKey')]">
        <ElInput
          :class="[globalShortcutKeyRegisterError.get('globalBossKey') ? 'register-error' : '']"
          v-model="shortcutKey.globalBossKey"
          readonly
          @keydown="bossKeyListener"
        />
      </SettingsCardItem>
    </SettingsCard>
  </div>
</template>

<style scoped lang="scss">
.settings-shortcut-key {

  :deep(.el-input) {
    height: 25px;

    &.register-error {
      .el-input__inner {
        color: var(--rc-error-color);
        font-weight: bold;
      }
    }

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 15px !important;
        text-align: center;
      }

      * {
        cursor: default;
      }
    }
  }
}
</style>