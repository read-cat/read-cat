<script setup lang="ts">
import {
  ElTooltip,
  ElDivider,
  ElSelect,
  ElOption,
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
import IconAcoustic from '../../assets/svg/icon-acoustic.svg';
import IconPlayerStop from '../../assets/svg/icon-player-stop.svg';
import IconPlayerPlay from '../../assets/svg/icon-player-play.svg';
import IconPlayerPause from '../../assets/svg/icon-player-pause.svg';
import IconPlayerFastReverse from '../../assets/svg/icon-player-fast-reverse.svg';
import IconPlayerFastForWard from '../../assets/svg/icon-player-fast-forward.svg';
import Window, { WindowEvent } from '../window/index.vue';
import Settings from '../settings/index.vue'

import { useRouter } from 'vue-router';
import { useWindowStore } from '../../store/window';
import { PagePath } from '../../core/window';
import { useEvent } from './hooks/event';
import { ref } from 'vue';
import { PluginType } from '../../core/plugins';
import { useReadAloud } from './hooks/read-aloud';


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

const settingsWindow = ref<WindowEvent>();
const { platform } = process;


const showReadAloud = () => {
  return GLOBAL_PLUGINS.getPluginsByType(PluginType.TTS_ENGINE, {
    enable: true
  }).length > 0;
}

const {
  readAloudPlayerWindow,
  showReadAloudPlayerWindow,
  readAloudPlayerWindowConfig,
  readAloudPlaybackRates,
  readAloudPlaybackRate,
  readAloudPlaybackRateChange,
  readAloudIsPlay,
  readAloudRef,
  readAloudPlay,
  readAloudPause,
  readAloudStop,
  readAloudFastForward,
  readAloudFastReverse,
} = useReadAloud();


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
      <ElTooltip v-memo="[win.currentPath, showReadAloud()]" v-if="win.currentPath === PagePath.READ && showReadAloud()"
        effect="light" content="朗读" placement="bottom" :show-after="1000">
        <button class="rc-button" @click="showReadAloudPlayerWindow">
          <IconAcoustic />
        </button>
      </ElTooltip>
      <Window :width="readAloudPlayerWindowConfig.width" :height="readAloudPlayerWindowConfig.height"
        :top="readAloudPlayerWindowConfig.y" :left="readAloudPlayerWindowConfig.x" destroy-on-close
        @event="e => readAloudPlayerWindow = e" class-name="read-aloud-player-window">
        <div>
          <div class="btns">
            <ElTooltip v-once effect="light" content="快退" placement="bottom" :show-after="1000">
              <button class="rc-button" @click="readAloudFastReverse">
                <IconPlayerFastReverse />
              </button>
            </ElTooltip>
            <ElTooltip v-memo="[readAloudIsPlay]" effect="light" :content="readAloudIsPlay ? '暂停' : '播放'" placement="bottom" :show-after="1000">
              <button class="rc-button" @click="readAloudIsPlay ? readAloudPause() : readAloudPlay()">
                <IconPlayerPlay v-if="!readAloudIsPlay" />
                <IconPlayerPause v-else />
              </button>
            </ElTooltip>
            <ElTooltip v-once effect="light" content="快进" placement="bottom" :show-after="1000">
              <button class="rc-button" @click="readAloudFastForward">
                <IconPlayerFastForWard />
              </button>
            </ElTooltip>
            <ElTooltip v-once effect="light" content="停止" placement="bottom" :show-after="1000">
              <button class="rc-button" @click="readAloudStop">
                <IconPlayerStop />
              </button>
            </ElTooltip>
          </div>

          <ElSelect
            v-model="readAloudPlaybackRate"
            popper-class="playback-rate-select"
            size="small"
            style="width: 70px;"
            @change="readAloudPlaybackRateChange"
          >
            <ElOption v-for="rate of readAloudPlaybackRates" :key="rate" :label="`${rate} X`" :value="rate" />
          </ElSelect>
        </div>
      </Window>
      <audio v-once ref="readAloudRef" autoplay></audio>
      <ElTooltip v-memo="[win.isDark]" effect="light" :content="win.isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom"
        :show-after="1000">
        <button class="rc-button" @click="dark">
          <IconMoon v-if="win.isDark" />
          <IconSun v-else />
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
      <Window width="840" height="550" centerX centerY destroy-on-close :click-hide="false"
        @event="e => settingsWindow = e">
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
<style lang="scss">
.read-aloud-player-window {
  &>div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px;
    height: 100%;

    .btns {
      display: flex;
      align-items: center;
      button {
        width: 25px;
        height: 25px;

        &+button.rc-button {
          margin-left: 5px;
        }

        svg {
          width: 20px;
          height: 20px;
        }
      }
    }

  }
}
.playback-rate-select {
  .el-select-dropdown__list {
    li {
      padding: 0 15px;
      height: 25px;
      line-height: 25px;
    }
  }
}
</style>
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