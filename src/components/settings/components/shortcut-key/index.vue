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
  prevPageListener,
  nextPageListener,
  scrollUpListener,
  scrollDownListener,
  openDevToolsListener,
  zoomInWindowListener,
  zoomOutWindowListener,
  zoomRestWindowListener,
  bossKeyListener,
  fullScreenWindowListener,
  readAloudToggleListener,
  readAloudPrevChapterListener,
  readAloudNextChapterListener,
  readAloudFastForwardListener,
  readAloudFastRewindListener,
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
      <SettingsCardItem title="上一章" help="仅阅读界面有效" v-memo="[shortcutKey.prevChapter]">
        <ElInput v-model="shortcutKey.prevChapter" readonly @keydown="prevChapterListener" />
      </SettingsCardItem>
      <SettingsCardItem title="下一章" help="仅阅读界面有效" v-memo="[shortcutKey.nextChapter]">
        <ElInput v-model="shortcutKey.nextChapter" readonly @keydown="nextChapterListener" />
      </SettingsCardItem>
      <SettingsCardItem title="上一页" help="仅阅读界面有效" v-memo="[shortcutKey.prevPage]">
        <ElInput v-model="shortcutKey.prevPage" readonly @keydown="prevPageListener" />
      </SettingsCardItem>
      <SettingsCardItem title="下一页" help="仅阅读界面有效" v-memo="[shortcutKey.nextPage]">
        <ElInput v-model="shortcutKey.nextPage" readonly @keydown="nextPageListener" />
      </SettingsCardItem>
      <SettingsCardItem title="向上滚动" v-memo="[shortcutKey.scrollUp]">
        <ElInput v-model="shortcutKey.scrollUp" readonly @keydown="scrollUpListener" />
      </SettingsCardItem>
      <SettingsCardItem title="向下滚动" v-memo="[shortcutKey.scrollDown]">
        <ElInput v-model="shortcutKey.scrollDown" readonly @keydown="scrollDownListener" />
      </SettingsCardItem>
      <SettingsCardItem title="全屏" v-memo="[shortcutKey.fullScreen]">
        <ElInput v-model="shortcutKey.fullScreen" readonly @keydown="fullScreenWindowListener" />
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
      <SettingsCardItem title="打开控制台" v-memo="[shortcutKey.openDevTools]">
        <ElInput v-model="shortcutKey.openDevTools" readonly @keydown="openDevToolsListener" />
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
      <SettingsCardItem title="朗读 播放/暂停" v-memo="[shortcutKey.globalReadAloudToggle, globalShortcutKeyRegisterError.get('globalReadAloudToggle')]">
        <ElInput
          :class="[globalShortcutKeyRegisterError.get('globalReadAloudToggle') ? 'register-error' : '']"
          v-model="shortcutKey.globalReadAloudToggle"
          readonly
          @keydown="readAloudToggleListener"
        />
      </SettingsCardItem>
      <SettingsCardItem title="朗读 上一章" v-memo="[shortcutKey.globalReadAloudPrevChapter, globalShortcutKeyRegisterError.get('globalReadAloudPrevChapter')]">
        <ElInput
          :class="[globalShortcutKeyRegisterError.get('globalReadAloudPrevChapter') ? 'register-error' : '']"
          v-model="shortcutKey.globalReadAloudPrevChapter"
          readonly
          @keydown="readAloudPrevChapterListener"
        />
      </SettingsCardItem>
      <SettingsCardItem title="朗读 下一章" v-memo="[shortcutKey.globalReadAloudNextChapter, globalShortcutKeyRegisterError.get('globalReadAloudNextChapter')]">
        <ElInput
          :class="[globalShortcutKeyRegisterError.get('globalReadAloudNextChapter') ? 'register-error' : '']"
          v-model="shortcutKey.globalReadAloudNextChapter"
          readonly
          @keydown="readAloudNextChapterListener"
        />
      </SettingsCardItem>
      <SettingsCardItem title="朗读 快进" v-memo="[shortcutKey.globalReadAloudFastForward, globalShortcutKeyRegisterError.get('globalReadAloudFastForward')]">
        <ElInput
          :class="[globalShortcutKeyRegisterError.get('globalReadAloudFastForward') ? 'register-error' : '']"
          v-model="shortcutKey.globalReadAloudFastForward"
          readonly
          @keydown="readAloudFastForwardListener"
        />
      </SettingsCardItem>
      <SettingsCardItem title="朗读 快退" v-memo="[shortcutKey.globalReadAloudFastRewind, globalShortcutKeyRegisterError.get('globalReadAloudFastRewind')]">
        <ElInput
          :class="[globalShortcutKeyRegisterError.get('globalReadAloudFastRewind') ? 'register-error' : '']"
          v-model="shortcutKey.globalReadAloudFastRewind"
          readonly
          @keydown="readAloudFastRewindListener"
        />
      </SettingsCardItem>
    </SettingsCard>
  </div>
</template>

<style scoped lang="scss">
.settings-shortcut-key {

  :deep(.el-input) {
    height: 30px;

    &.register-error {
      .el-input__wrapper {
        box-shadow: 0 0 0 1px var(--rc-error-color);
        .el-input__inner {
          color: var(--rc-error-color);
          font-weight: bold;
        }
      }
      
    }

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 20px !important;
        text-align: center;
      }

      * {
        cursor: default;
      }
    }
  }
}
</style>