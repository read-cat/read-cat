<script setup lang="ts">
import { ElContainer, ElHeader, ElMain } from 'element-plus';
import { Transition, computed, onMounted, watchEffect } from 'vue';
import Toolbar from './components/toolbar/index.vue';
import { useRouter } from 'vue-router';
import GoBack from './components/go-back/index.vue';
import ReadState from './components/read-state/index.vue';
import Navigation from './components/navigation/index.vue';
import { useScrollTopStore } from './store/scrolltop';
import Search from './components/search/index.vue';
import { useWindowStore } from './store/window';
import { PagePath } from './core/window';
import { useSettingsStore } from './store/settings';
import { storeToRefs } from 'pinia';
import { colorIsLight, getColorRGB } from './core/utils';
import { Backtop, CloseButton, Window } from './components';
import { useUpdateStore } from './store/update';

const win = useWindowStore();
const { transparentWindow } = storeToRefs(win);
const router = useRouter();
router.afterEach((to, _, fail) => {
  if (fail) {
    return;
  }
  const v = PagePath.valueOf(to.path);
  if (!v) {
    GLOBAL_LOG.error('router current path:', to.path, v);
    return;
  }
  win.currentPath = v;
  const title = document.head.querySelector('title');
  title && (title.innerText = (to.meta.title ? `${to.meta.title} | ` : '') + 'ReadCat');
});

const { setScrollTop: _setScrollTop } = useScrollTopStore();
const setScrollTop = ({ target }: Event) => {
  if (!target) {
    return;
  }
  const _target = target as HTMLElement;
  _setScrollTop(win.currentPath, _target.scrollTop);
  if (win.currentPath === PagePath.READ) {
    win.calcReadProgress(_target);
  }
}

const { options, window } = useSettingsStore();
const { platform } = process;
const {
  backgroundColor,
  texture,
  windowOpacity,
  backgroundImage,
  backgroundBlur,
  backgroundBlurBgColor,
  backgroundSize,
} = storeToRefs(useSettingsStore());

const updateStore = useUpdateStore();
const { updateWindowRef, version } = storeToRefs(updateStore);
const updateListener = () => {
  updateStore.deleteUpdaterFile();
  updateStore.update().finally(() => {
    win.removeEventListener('inited', updateListener);
  });
}
options.enableAppStartedFindNewVersion && win.addEventListener('inited', updateListener);

onMounted(() => {
  watchEffect(() => {
    let val = 'var(--rc-button-hover-bgcolor)';
    if (win.currentPath === PagePath.READ && !win.isDark) {
      const [r, g, b] = getColorRGB(backgroundColor.value);
      val = colorIsLight(r, g, b) ? 'var(--rc-button-hover-bgcolor-light)' : 'var(--rc-button-hover-bgcolor-dark)';
    }
    if (backgroundImage.value) {
      if (backgroundBlur.value === 'dark') {
        val = 'var(--rc-button-hover-bgcolor-dark)';
      } else if (backgroundBlur.value === 'light') {
        val = 'var(--rc-button-hover-bgcolor-light)';
      }
    }
    document.body.style.setProperty('--rc-button-hover-background-color', val);
  });
  watchEffect(() => {
    if (!transparentWindow.value) {
      return;
    }
    if (window.opacity > 0) {
      document.body.style.opacity = windowOpacity.value;
      document.body.style.removeProperty('--el-mask-color');
      document.body.style.removeProperty('--rc-header-color');
    } else {
      document.body.style.opacity = '';
      document.body.style.setProperty('--el-mask-color', 'transparent');
      document.body.style.setProperty('--rc-header-color', 'transparent');
    }
  });
});


const backgroundImageComputed = computed(() => {
  return transparentWindow.value && window.opacity <= 0 ? '' : backgroundImage.value;
});
const backgroundColorComputed = computed(() => {
  return transparentWindow.value ? '' : backgroundColor.value;
});
const backgroundBlurBgColorComputed = computed(() => {
  return transparentWindow.value && window.opacity <= 0 ? 'transparent' : backgroundBlurBgColor.value;
});
const mainBackgroundColorComputed = computed(() => {
  return backgroundImage.value || (transparentWindow.value && window.opacity <= 0) ? 'transparent' : '';
});
/**当前是否为阅读界面 */
const isReadPageComputed = computed(() => {
  return win.currentPath === PagePath.READ;
});
</script>

<template>
  <ElContainer id="container" :style="{
    '--rc-header-color': win.backgroundColor,
    backgroundImage: backgroundImageComputed,
    backgroundSize,
    backgroundColor: backgroundColorComputed,
  }">
    <ElHeader id="header" :class="[
      'app-drag',
      platform, win.isFullScreen ? 'fullscreen' : '',
      isReadPageComputed ? texture : '',
      backgroundBlur ? 'app-blur' : '',
    ]" :style="{
      '--rc-text-color': win.textColor,
      backgroundColor: backgroundBlurBgColorComputed
    }">
      <div class="left-box">
        <div v-if="platform === 'darwin'" v-once class="window-controls-container app-no-darg"></div>
        <div v-show="!isReadPageComputed" id="logo">
          <img class="app-drag" src="/icons/512x512.png" alt="ReadCat">
        </div>
        <Navigation v-show="!isReadPageComputed" :path="win.currentPath" class="navigation app-no-drag" />
        <GoBack id="goback" class="app-no-drag" :style="{
          marginLeft: isReadPageComputed ? '0' : '10px'
        }" />
        <ReadState id="read-state" v-if="isReadPageComputed" />
      </div>
      <div class="center-box">
        <Search :path="win.currentPath" class="app-no-drag" />
      </div>
      <div class="right-box">
        <Toolbar :path="win.currentPath" class="app-no-drag" />
        <div v-if="platform === 'win32' && !win.isOverwriteTitleBar"
          :class="['window-controls-container', 'app-no-darg', platform, win.isFullScreen ? 'fullscreen' : '']"></div>
      </div>
    </ElHeader>
    <ElMain id="main" :class="[
      'rc-scrollbar',
      options.enableTransition ? 'rc-scrollbar-behavior' : '',
      isReadPageComputed ? texture : '',
    ]" @scroll="(e: any) => setScrollTop(e)" :style="{
      '--rc-main-color': win.backgroundColor,
      '--rc-text-color': win.textColor,
      backgroundColor: mainBackgroundColorComputed
    }">
      <RouterView v-slot="{ Component }">
        <Transition :name="options.enableTransition ? 'router_animate' : void 0">
          <Component :is="Component" />
        </Transition>
      </RouterView>
      <Backtop
        v-if="!isReadPageComputed || (isReadPageComputed && options.enableReadBacktop)"
        target="#main" />
    </ElMain>
    <Window class-name="update-window" center-x center-y destroy-on-close :z-index="1001" :click-hide="false"
      @event="e => updateWindowRef = e">
      <section :class="[version?.htmlUrl ? '' : 'update-log']">
        <header>
          <div class="info">
            <CloseButton @click="updateStore.closeUpdateWindow" />
            <img src="/public/icons/512x512.png" alt="logo">
            <h3>ReadCat</h3>
            <p class="version">{{ version?.newVersion }}</p>
          </div>
        </header>
        <main class="rc-scrollbar">
          <div class="body" v-html="version?.body"></div>
        </main>
        <footer>
          <button v-if="version?.downloadUrl" class="download" :style="{
            backgroundColor: updateStore.isDownloading ? 'rgba(30,120,235,0.3)' : '',
          }" @click="updateStore.download()">
            <div class="progress" :style="{
              '--download-progress': updateStore.progress
            }"></div>
            <span>{{ updateStore.isDownloading ? '下载中' : '下载' }}</span>
          </button>
          <button v-else @click="updateStore.openHtmlUrl()">下载</button>
        </footer>
      </section>
    </Window>
  </ElContainer>
</template>

<style lang="scss">
.update-window {
  section {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 0 10px 10px;
    height: calc(100% - 20px);

    &.update-log {
      main {
        height: calc(100% - 135px - 20px);
      }
      footer {
        display: none;
      }
    }

    header,
    footer {
      margin-right: 10px;
    }

    header {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 135px;

      .info {
        display: flex;
        flex-direction: column;
        align-items: center;

        .close-button {
          position: absolute;
          right: 10px;
        }

        img {
          margin: 10px 0;
          width: 60px;
          height: 60px;
          border-radius: 21px;
          box-shadow: 0 12px 32px 4px #1e78eb80, 0 8px 20px #1e78eb14;
        }

        h3 {
          color: var(--rc-theme-color);
        }

        p.desc {
          color: #A1A1A1;
          font-size: 12px;
        }

        p.version {
          margin-top: 5px;
          font-size: 14px;
          color: var(--rc-text-color);
        }
      }
    }

    main {
      padding-left: 10px;
      height: calc(100% - 135px - 30px - 20px);

      div.body {
        padding-right: 10px;
        &>* {
          margin-bottom: 10px;
        }

        * {
          user-select: text;
          cursor: default;
        }

        h3 {
          font-size: 16px;
        }

        ul {
          padding: 0 20px 10px 20px;
          list-style: initial;

          li {
            font-size: 14px;
          }
        }

        blockquote {
          padding-left: 10px;
          color: var(--rc-blockquote-color);
          border-left: 4px solid var(--rc-blockquote-border-color);
          font-size: 13px;
        }
      }
      
    }

    footer {
      height: 30px;

      button {
        width: 100%;
        height: 30px;
        color: #FFFFFF;
        font-size: 16px;
        background-color: #1E78EB;
        border-radius: 5px;
        transition: all 0.3s ease;
        overflow: hidden;
        &:hover {
          cursor: pointer;
          background-color: rgba(30, 120, 235, 0.7);
        }

        &:active {
          transform: scale(0.98);
        }
      }
      button.download {
        position: relative;
        div.progress{
          width: calc(var(--download-progress) * 100%);
          height: 100%;
          background-color: var(--rc-theme-color);
          transition: width 0.2s ease;
        }
        span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: currentColor;
          z-index: 10;
        }
      }
    }
  }
}
</style>

<style scoped lang="scss">
.router_animate-enter-active {
  animation: slideInLeft 0.4s;
}

.router_animate-leave-active {
  animation: slideOutLeft 0.1s;
}

#container {
  background-position: center;
  background-repeat: no-repeat;
}

#header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  height: calc(35px * var(--zoom-factor, 1));
  min-height: calc(35px / var(--zoom-factor, 1));
  background-color: var(--rc-header-color);
  box-shadow: var(--rc-header-box-shadow);
  z-index: 999;

  :deep(.rc-button:hover) {
    background-color: var(--rc-button-hover-background-color);
  }

  .left-box,
  .center-box,
  .right-box {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .left-box,
  .right-box {
    flex: 2.5;
  }

  .left-box {
    justify-content: flex-start;
  }

  .center-box {
    flex: 2.2;
  }

  .right-box {
    justify-content: flex-end;
  }

  #logo {
    display: flex;
    align-items: center;

    img {
      width: 24px;
      height: 24px;
    }
  }

  #timer,
  #read-progress {
    display: flex;
    align-items: center;
    height: 22px;
    line-height: 22px;
  }

  #read-progress {
    margin-left: 10px;
    font-size: 14px;
    color: var(--rc-text-color);
  }


}

#header:is(.win32):not(.fullscreen) {
  .right-box .window-controls-container {
    width: calc(135px / var(--zoom-factor, 1));
  }
}

#header:is(.darwin) {
  &:not(.fullscreen) {
    .left-box .window-controls-container {
      width: calc(65px / var(--zoom-factor, 1));
    }
  }

  .navigation {
    margin-left: 0;
  }

  #logo {
    display: none;
  }
}

#main {
  padding: 0;
  width: 100vw;
  height: calc(100vh - 35px);
  background-color: var(--rc-main-color);

  &>.container {
    position: relative;
    padding: 5px 0 5px 5px;
    min-height: calc(100% - 10px);
  }
}

@media screen and (max-width: 800px) {
  #header {
    .left-box {
      flex: 1;
    }
    .left-box,
    .right-box {
      width: auto;
      min-width: auto;
    }

    .center-box {
      width: 300px;
    }
  }
}
</style>
