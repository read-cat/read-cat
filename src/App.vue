<script setup lang="ts">
import { ElContainer, ElHeader, ElMain, ElBacktop } from 'element-plus';
import { Transition, onMounted, watchEffect } from 'vue';
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
import { useShortcutKey } from './hooks/shortcut-key';
import { storeToRefs } from 'pinia';
import { colorIsLight, getColorRGB } from './core/utils';

useShortcutKey();
const win = useWindowStore();
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

const { options } = useSettingsStore();
const { platform } = process;
const { backgroundColor, texture } = storeToRefs(useSettingsStore());
onMounted(() => {
  watchEffect(() => {
    let val = 'var(--rc-button-hover-bgcolor)';
    if (win.currentPath === PagePath.READ && !win.isDark) {
      const [r, g, b] = getColorRGB(backgroundColor.value);
      val = colorIsLight(r, g, b) ? 'var(--rc-button-hover-bgcolor-light)' : 'var(--rc-button-hover-bgcolor-dark)';
    }
    document.body.style.setProperty('--rc-button-hover-background-color', val);
  });
});
</script>

<template>
  <ElContainer id="container" :style="{
    '--rc-header-color': win.backgroundColor,
  }">
    <ElHeader id="header" :class="[
      'app-drag',
      platform, win.isFullScreen ? 'fullscreen' : '',
      win.currentPath === PagePath.READ ? texture : '',
    ]" :style="{
      '--rc-text-color': win.textColor
    }">
      <div class="left-box">
        <div v-if="platform === 'darwin'" v-once class="window-controls-container app-no-darg"></div>
        <div v-show="win.currentPath !== PagePath.READ" id="logo">
          <img class="app-drag" src="/icons/512x512.png" alt="ReadCat">
        </div>
        <Navigation v-show="win.currentPath !== PagePath.READ" :path="win.currentPath" class="navigation app-no-drag" />
        <GoBack id="goback" class="app-no-drag" :style="{
          marginLeft: win.currentPath === PagePath.READ ? '0' : '10px'
        }" />
        <ReadState id="read-state" v-if="win.currentPath === PagePath.READ" />
      </div>
      <div class="center-box">
        <Search :path="win.currentPath" class="app-no-drag" />
      </div>
      <div class="right-box">
        <Toolbar :path="win.currentPath" class="app-no-drag" />
        <div v-if="platform === 'win32'"
          :class="['window-controls-container', 'app-no-darg', platform, win.isFullScreen ? 'fullscreen' : '']"></div>
      </div>
    </ElHeader>
    <ElMain id="main"
      :class="[
        'rc-scrollbar',
        options.enableTransition ? 'rc-scrollbar-behavior' : '',
        win.currentPath === PagePath.READ ? texture : '',
      ]"
      @scroll="(e: any) => setScrollTop(e)" :style="{
        '--rc-main-color': win.backgroundColor,
        '--rc-text-color': win.textColor
      }">
      <RouterView v-slot="{ Component }">
        <Transition :name="options.enableTransition ? 'router_animate' : void 0">
          <Component :is="Component" />
        </Transition>
      </RouterView>
      <ElBacktop
        v-if="win.currentPath !== PagePath.READ || (win.currentPath === PagePath.READ && options.enableReadBacktop)"
        :right="50" :bottom="50" :visibility-height="200" target="#main" />
    </ElMain>
  </ElContainer>
</template>


<style scoped lang="scss">
.router_animate-enter-active {
  animation: slideInLeft 0.5s;
}

.router_animate-leave-active {
  animation: slideOutLeft 0.1s;
}

#header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
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

  $left-right-box-width: 320px;

  .left-box,
  .right-box {
    width: calc($left-right-box-width * var(--zoom-factor, 1));
    min-width: calc($left-right-box-width / var(--zoom-factor, 1));
  }

  .left-box {
    justify-content: flex-start;
  }

  .center-box {
    width: 280px;
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
</style>
