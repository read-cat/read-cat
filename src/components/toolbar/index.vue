<script lang="ts" setup>
import {
  ElDivider,
  ElSelect,
  ElOption,
  ElIcon,
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
import IconHeadphonesRoundSound from '../../assets/svg/icon-headphones-round-sound.svg';
import IconPlayerStop from '../../assets/svg/player/icon-player-stop.svg';
import IconPlayerPlay from '../../assets/svg/player/icon-player-play.svg';
import IconPlayerPause from '../../assets/svg/player/icon-player-pause.svg';
import IconPlayerFastRewind from '../../assets/svg/player/icon-player-rewind.svg';
import IconPlayerFastForWard from '../../assets/svg/player/icon-player-forward.svg';
import IconPlayerLoading from '../../assets/svg/player/icon-player-loading.svg';
import IconPlayerPoint from '../../assets/svg/player/icon-player-point.svg';
import IconPlayerSpeak from '../../assets/svg/player/icon-player-speak.svg';
import { Window, WindowEvent, Text } from '..';
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
  readAloudStatus,
  readAloudRef,
  readAloudPlay,
  readAloudPause,
  readAloudStop,
  readAloudFastForward,
  readAloudFastRewind,
  readAloudTransformStatus,
  readAloudSelectPlay,
  readAloudIsSelectPlay,
  readAloudVoicesWindow,
  showReadAloudVoicesWindow,
  readAloudVoices,
  readAloudCurrentVoice,
  selectReadAloudVoice,
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
      <button v-memo="[win.refreshEventMap.get(win.currentPath)]" v-if="win.refreshEventMap.get(win.currentPath)"
        class="rc-button" @click="refresh()" title="刷新">
        <IconRedo />
      </button>
      <button v-memo="[win.currentPath, showReadAloud(), readAloudPlayerWindow?.isShow()]" v-if="win.currentPath === PagePath.READ && showReadAloud()"
        :class="['rc-button', readAloudPlayerWindow?.isShow() ? 'is-show-read-aloud-window' : '']" @click="showReadAloudPlayerWindow" title="朗读">
        <ElIcon size="18"><IconHeadphonesRoundSound /></ElIcon>
      </button>
      <Window :width="readAloudPlayerWindowConfig.width" :height="readAloudPlayerWindowConfig.height"
        :top="readAloudPlayerWindowConfig.y" :left="readAloudPlayerWindowConfig.x" destroy-on-close
        @event="e => readAloudPlayerWindow = e" class-name="read-aloud-player-window">
        <div>
          <div class="btns">
            <button v-memo="[readAloudIsSelectPlay]" :title="readAloudIsSelectPlay ? '取选择取' : '选择播放'"
              :class="[readAloudIsSelectPlay ? 'is-select' : '']" @click="readAloudSelectPlay">
              <IconPlayerPoint />
            </button>
            <button v-once title="发音人" @click="showReadAloudVoicesWindow">
              <IconPlayerSpeak />
            </button>
            <button v-once title="快退" @click="readAloudFastRewind">
              <IconPlayerFastRewind />
            </button>
            <button v-if="readAloudStatus === 'wait' && readAloudTransformStatus && readAloudTransformStatus !== 'end'"
              v-memo="[readAloudStatus, readAloudTransformStatus]" disable class="play loading" title="缓存中">
              <ElIcon class="is-loading" size="20">
                <IconPlayerLoading />
              </ElIcon>
            </button>
            <button v-else v-memo="[readAloudStatus]" effect="light" :title="readAloudStatus === 'play' ? '暂停' : '播放'"
              class="play" @click="readAloudStatus === 'play' ? readAloudPause() : readAloudPlay()">
              <IconPlayerPlay v-if="readAloudStatus !== 'play'" />
              <IconPlayerPause v-else />
            </button>
            <button v-once title="快进" @click="readAloudFastForward">
              <IconPlayerFastForWard />
            </button>
            <button v-once title="停止" @click="readAloudStop">
              <IconPlayerStop />
            </button>
            
          </div>
          <ElSelect v-model="readAloudPlaybackRate" suffix-icon="" popper-class="playback-rate-select" size="small"
            style="width: 70px;" @change="readAloudPlaybackRateChange">
            <ElOption v-for="rate of readAloudPlaybackRates" :key="rate" :label="`${rate} X`" :value="rate" />
          </ElSelect>
        </div>
      </Window>
      <Window width="300" height="300" center-x center-y destroy-on-close @event="e => readAloudVoicesWindow = e"
        class-name="read-aloud-voices-window">
        <ul class="rc-scrollbar">
          <li v-for="voice of readAloudVoices" :key="voice.name"
            :class="[readAloudCurrentVoice?.name === voice.name ? 'select-voice' : '', 'rc-button']"
            @click="selectReadAloudVoice(voice)">
            <Text ellipsis :title="voice.name">{{ voice.name }}</Text>
          </li>
        </ul>
      </Window>
      <audio v-once ref="readAloudRef" autoplay></audio>
      <button v-memo="[win.isDark]" :title="win.isDark ? '切换到浅色模式' : '切换到深色模式'" class="rc-button" @click="dark">
        <IconMoon v-if="win.isDark" />
        <IconSun v-else />
      </button>
      <button v-if="false" v-memo="[win.currentPath]" title="历史记录"
        :class="['rc-button', win.currentPath === PagePath.HISTORY ? 'li-selected' : '']"
        @click="router.push('/history')">
        <IconHistory />
      </button>
      <button v-memo="[settingsWindow?.isShow()]" title="设置"
        :class="['rc-button', settingsWindow?.isShow() ? 'li-selected' : '']" @click="settingsWindow?.show()">
        <IconSettings />
      </button>
      <Window width="85%" height="80%" centerX centerY destroy-on-close :click-hide="false"
        @event="e => settingsWindow = e">
        <Settings :window="settingsWindow" />
      </Window>
    </div>
    <template v-if="platform === 'linux'">
      <ElDivider v-memo="[win.currentPath, win.isDark]" direction="vertical" :style="{
        '--el-border-color': win.currentPath === PagePath.READ && !win.isDark ? 'var(--rc-text-color)' : '',
      }" />
      <div class="window-bar center">
        <button v-once title="最小化" class="rc-button" @click="minimize">
          <IconMinimize />
        </button>
        <button v-memo="[win.isFullScreen, win.isMaximize]" v-if="!win.isFullScreen" class="rc-button"
          @click="maximizeOrRestore" :title="win.isFullScreen ? '退出全屏' : (win.isMaximize ? '还原' : '最大化')">
          <IconMaximize v-if="!win.isMaximize" />
          <IconMaximizeRestore v-else />
        </button>
        <button v-else class="rc-button" @click="exitFullScreen">
          <IconExitFullScreen />
        </button>
        <button v-once title="关闭" class="rc-button" @click="close">
          <IconClose />
        </button>
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
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        transition: all 0.3s ease;
        cursor: pointer;
        color: var(--rc-text-color);
        &:hover {
          transform: scale(1.1);
        }
        &:active {
          transform: scale(0.95);
        }
        &+button {
          margin-left: 10px;
        }

        svg {
          width: 18px;
          height: 18px;
        }
        
        &.play {
          width: 30px;
          height: 30px;
          color: #FFFFFF;
          background-color: var(--rc-theme-color);
          box-shadow: 0px 0px 12px rgb(30, 120, 235, 0.5);
          border-radius: 50%;
        }
        &.loading {
          &:hover,
          &:active {
            transform: none;
          }
          
        }
        &.is-select {
          color: var(--rc-theme-color);
        }
      }
    }
  }
  .el-select {
    margin-right: 5px;
    width: 35px !important;
    .el-select__wrapper {
      padding: 2px 0;
      background-color: transparent;
      box-shadow: none;
    }
    .el-select__selected-item {
      text-align: right;

      span {
        font-size: 14px;
        font-weight: bold;
        color: var(--rc-text-color) !important;
      }
    }
    .el-select__suffix {
      display: none;
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

.read-aloud-voices-window {
  padding: 10px 0;

  ul {
    padding: 0 10px;
    height: 300px;

    li {
      padding: 0 5px;
      height: 25px;
      font-size: 13px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &+li {
        margin-top: 5px;
      }

      &.select-voice {
        color: var(--rc-theme-color);
      }

      &:active {
        transform: scale(0.96);
      }

      .rc-text {
        line-height: normal !important;
      }
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
  .app-bar {
    .is-show-read-aloud-window {
      color: var(--rc-theme-color);
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