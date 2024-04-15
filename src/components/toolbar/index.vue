<script setup lang="ts">
import {
  ElTooltip,
  ElDivider
} from 'element-plus';
import IconMinimize from '../../assets/svg/icon-minimize.svg';
import IconMaximize from '../../assets/svg/icon-maximize.svg';
import IconMaximizeRestore from '../../assets/svg/icon-maximize-restore.svg';
import IconClose from '../../assets/svg/icon-close.svg';
import IconMoon from '../../assets/svg/icon-moon.svg';
import IconSun from '../../assets/svg/icon-sun.svg';
import IconHistory from '../../assets/svg/icon-history.svg';
import IconSettings from '../../assets/svg/icon-settings.svg';
import IconExitFullScreen from '../../assets/svg/icon-exit-fullscreen.svg';
import IconRedo from '../../assets/svg/icon-redo.svg';
import IconPlay from '../../assets/svg/icon-play.svg';
import IconPause from '../../assets/svg/icon-pause.svg';
import Window, { WindowEvent } from '../window/index.vue';
import Settings from '../settings/index.vue'

import { useRouter } from 'vue-router';
import { useWindowStore } from '../../store/window';
import { PagePath } from '../../core/window';
import { useEvent } from './hooks/event';
import { ref, watch } from 'vue';
import { useReadAloudStore } from '../../store/read-aloud';
import { storeToRefs } from 'pinia';
import { useTextContentStore } from '../../store/text-content';
import { PluginType } from '../../core/plugins';


const router = useRouter();
const win = useWindowStore();
const {
  refresh,
  dark,
  minimize,
  maximizeOrRestore,
  close,
  exitFullScreen
} = useEvent();
const { isPlay, readAloudRef } = storeToRefs(useReadAloudStore());
const { play, pause } = useReadAloudStore();
const { currentChapter } = storeToRefs(useTextContentStore());
const settingsWindow = ref<WindowEvent>();
const { platform } = process;

watch(() => [win.currentPath, currentChapter.value], () => {
  pause();
});
const showReadAloud = () => {
  return GLOBAL_PLUGINS.getPluginsByType(PluginType.TTS_ENGINE, {
    enable: true
  }).length > 0;
}
</script>
<script lang="ts">
export default {
  name: 'Toolbar'
}
</script>
<template>
  <div class="container center">
    <div class="app-bar center">
      <ElTooltip v-memo="[win.refreshEventMap.get(win.currentPath)]" v-if="win.refreshEventMap.get(win.currentPath)"
        effect="light" content="刷新" placement="bottom" :show-after="1000">
        <button class="rc-button" @click="refresh()">
          <IconRedo />
        </button>
      </ElTooltip>
      <ElTooltip v-memo="[win.currentPath, isPlay, showReadAloud()]" v-if="win.currentPath === PagePath.READ && showReadAloud()" effect="light"
        :content="isPlay ? '暂停' : '朗读'" placement="bottom" :show-after="1000">
        <button class="rc-button" @click="() => isPlay ? pause() : play()">
          <IconPlay v-if="!isPlay" />
          <IconPause v-else />
        </button>
      </ElTooltip>
      <audio v-once ref="readAloudRef" autoplay></audio>
      <ElTooltip v-memo="[win.isDark]" effect="light" :content="win.isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom"
        :show-after="1000">
        <button class="rc-button" @click="dark">
          <IconMoon style="color: #6F6CFF;" v-if="win.isDark" />
          <IconSun style="color: #FF960F" v-else />
        </button>
      </ElTooltip>
      <ElTooltip v-memo="[win.currentPath]" effect="light" content="历史记录" placement="bottom" :show-after="1000">
        <button :class="['rc-button', win.currentPath === PagePath.HISTORY ? 'li-selected' : '']"
          @click="router.push('/history')">
          <IconHistory />
        </button>
      </ElTooltip>
      <ElTooltip v-memo="[settingsWindow?.isShow()]" effect="light" content="设置" placement="bottom" :show-after="1000">
        <button :class="['rc-button', settingsWindow?.isShow() ? 'li-selected' : '']" @click="settingsWindow?.show()">
          <IconSettings />
        </button>
      </ElTooltip>
      <Window width="840" height="550" center destroy-on-close :click-hide="false" @event="e => settingsWindow = e">
        <Settings :window="settingsWindow" />
      </Window>
    </div>
    <template v-if="platform === 'linux'">
      <ElDivider v-memo="[win.currentPath, win.isDark]" direction="vertical" :style="{
        '--el-border-color': win.currentPath === PagePath.READ && !win.isDark ? 'var(--rc-text-color)' : '',
      }" />
      <div class="window-bar center">
        <ElTooltip v-once effect="light" content="最小化" placement="bottom" :show-after="1000">
          <button class="rc-button" @click="minimize">
            <IconMinimize />
          </button>
        </ElTooltip>
        <ElTooltip v-memo="[win.isFullScreen, win.isMaximize]" effect="light"
          :content="win.isFullScreen ? '退出全屏' : (win.isMaximize ? '还原' : '最大化')" placement="bottom" :show-after="1000">
          <button v-if="!win.isFullScreen" class="rc-button" @click="maximizeOrRestore">
            <IconMaximize v-if="!win.isMaximize" />
            <IconMaximizeRestore v-else />
          </button>
          <button v-else class="rc-button" @click="exitFullScreen">
            <IconExitFullScreen />
          </button>
        </ElTooltip>
        <ElTooltip v-once effect="light" content="关闭" placement="bottom" :show-after="1000">
          <button class="rc-button" @click="close">
            <IconClose />
          </button>
        </ElTooltip>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.center {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.container {
  button {
    width: 25px;
    height: 25px;

    margin-right: 5px;

    &:last-child {
      margin: 0;
    }
  }

  .window-bar {
    button {

      &:last-child {
        &:hover {
          color: #de3e3e;
        }
      }
    }
  }

}
</style>