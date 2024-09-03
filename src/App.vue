<script setup lang="ts">
import { ElContainer, ElHeader, ElMain } from 'element-plus';
import { computed, onMounted, watchEffect } from 'vue';
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
const updateListener = async () => {
  try {
    if (!options.enableAppStartedFindNewVersion) {
      return;
    }
    await updateStore.deleteUpdaterFile(true);
    await updateStore.update();
  } finally {
    win.removeEventListener('inited', updateListener);
  }
}
win.addEventListener('inited', updateListener);

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
          marginLeft: isReadPageComputed ? '0' : '1rem'
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
      <Backtop v-if="!isReadPageComputed || (isReadPageComputed && options.enableReadBacktop)" target="#main" />
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
            <span>{{ updateStore.isDownloading ? updateStore.progress >= 1 ? '安装中' : '下载中' : '下载' }}</span>
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
    padding: 1rem 0 1rem 1rem;
    height: calc(100% - 2rem);

    &.update-log {
      main {
        height: calc(100% - 13.5rem - 2rem);
      }

      footer {
        display: none;
      }
    }

    header,
    footer {
      margin-right: 1rem;
    }

    header {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 13.5rem;

      .info {
        display: flex;
        flex-direction: column;
        align-items: center;

        .close-button {
          position: absolute;
          right: 1rem;
        }

        img {
          margin: 1rem 0;
          width: 6rem;
          height: 6rem;
          border-radius: 2.1rem;
          box-shadow: 0 1.2rem 3.2rem .4rem #1e78eb80, 0 .8rem 2rem #1e78eb14;
        }

        h3 {
          color: var(--rc-theme-color);
        }

        p.desc {
          color: #A1A1A1;
          font-size: 1.2rem;
        }

        p.version {
          margin-top: .5rem;
          font-size: 1.4rem;
          color: var(--rc-text-color);
        }
      }
    }

    main {
      padding-left: 1rem;
      height: calc(100% - 13.5rem - 3rem - 2rem);

      div.body {
        padding-right: 1rem;

        &>* {
          margin-bottom: 1rem;
        }

        * {
          user-select: text;
          cursor: default;
        }

        h3 {
          font-size: 1.6rem;
        }

        ul {
          padding: 0 2rem 1rem 2rem;
          list-style: initial;

          li {
            margin-bottom: .5rem;
            font-size: 1.4rem;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }

        blockquote {
          padding-left: 1rem;
          color: var(--rc-blockquote-color);
          border-left: .4rem solid var(--rc-blockquote-border-color);
          font-size: 1.3rem;
        }
      }

    }

    footer {
      height: 3rem;

      button {
        width: 100%;
        height: 3rem;
        color: #FFFFFF;
        font-size: 1.6rem;
        background-color: #1E78EB;
        border-radius: .5rem;
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

        div.progress {
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
  height: calc(3.5rem * var(--zoom-factor, 1));
  min-height: calc(3.5rem / var(--zoom-factor, 1));
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
      width: 2.4rem;
      height: 2.4rem;
    }
  }

  #timer,
  #read-progress {
    display: flex;
    align-items: center;
    height: 2.2rem;
    line-height: 2.2rem;
  }

  #read-progress {
    margin-left: 1rem;
    font-size: 1.4rem;
    color: var(--rc-text-color);
  }


}

#header:is(.win32):not(.fullscreen) {
  .right-box .window-controls-container {
    width: calc(13.5rem / var(--zoom-factor, 1));
  }
}

#header:is(.darwin) {
  &:not(.fullscreen) {
    .left-box .window-controls-container {
      width: calc(6.5rem / var(--zoom-factor, 1));
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
  height: calc(100vh - 3.5rem);
  background-color: var(--rc-main-color);

  &>.container {
    position: relative;
    padding: .5rem 0 .5rem .5rem;
    min-height: calc(100% - 1rem);
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
      width: 30rem;
    }
  }
}
</style>
