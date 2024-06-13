<script setup lang="ts">
import { Window, WindowEvent, WindowSize, Text } from '..';
import IconSearch from '../../assets/svg/icon-search.svg';
import IconOpenBook from '../../assets/svg/icon-open-book.svg';
import IconLoadingPlay from '../../assets/svg/icon-loading-play.svg';
import { useSearchStore } from '../../store/search';
import { PagePath } from '../../core/window';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../store/window';
import SearchBox from './components/search-box/index.vue';
import ChapterBox from './components/chapter-box/index.vue';
import { reactive, ref } from 'vue';
import { useHeaderStyle } from '../../hooks/header-style';
import { useSettingsStore } from '../../store/settings';


const win = useWindowStore();
const { currentPath, searchBoxHeaderText, transparentWindow } = storeToRefs(win);

const searchKey = ref('');
const searchProgress = ref(0);
const { searchStyle } = useHeaderStyle(searchKey, searchProgress);

const { isRunningSearch } = storeToRefs(useSearchStore());

const winEvent = ref<WindowEvent>();
const showSearchBox = () => {
  if (win.disableShowSearchBox.get(win.currentPath)) {
    return;
  }
  winEvent.value?.show();
}

const winSize = reactive<WindowSize>({
  width: '40rem',
  height: '50rem'
});

const { backgroundImage } = storeToRefs(useSettingsStore());
</script>
<script lang="ts">
export default {
  name: 'Search'
}
</script>
<template>
  <div class="container" :style="{
    '--rc-search-border-color': searchStyle.borderColor,
    '--rc-search-bgcolor': searchStyle.backgroundColor,
    '--rc-theme-color': searchStyle.color,
    '--rc-search-box-bgcolor': searchStyle.boxBackgroundColor,
  }">
    <div id="search" @click="showSearchBox">
      <div class="title">
        <IconOpenBook v-if="currentPath === PagePath.READ" />
        <IconLoadingPlay v-else-if="isRunningSearch && currentPath === PagePath.SEARCH" />
        <IconSearch v-else />
        <Text ellipsis v-memo="[searchBoxHeaderText]">{{ searchBoxHeaderText }}</Text>
      </div>
    </div>
    <Window
      :to-body="!!backgroundImage || transparentWindow"
      destroy-on-close :top="5"
      center-x
      :width="winSize.width"
      :height="winSize.height"
      :background-color="backgroundImage ? '' : 'var(--rc-search-box-bgcolor)'"
      @event="e => winEvent = e"
    >
      <SearchBox v-if="currentPath !== PagePath.READ" v-model:search-key="searchKey" v-model:search-progress="searchProgress" :window-event="winEvent" :window-size="winSize" />
      <ChapterBox :window-event="winEvent" v-else />
    </Window>
  </div>
</template>

<style scoped lang="scss">
.container {
  position: relative;
  width: 100%;
  #search {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 .5rem;
    width: calc(100% - 1.2rem);
    height: 2.4rem;
    color: var(--rc-theme-color);
    font-size: 1.2rem;
    border: .1rem solid var(--rc-search-border-color);
    border-radius: .5rem;
    background-color: var(--rc-search-bgcolor);
    cursor: pointer;

    .title {
      display: flex;
      align-items: center;
      max-width: 100%;
      span {
        margin-left: .5rem;
        max-width: 27rem;
      }
      svg {
        width: 1.4rem;
        height: 1.4rem;
      }
    }
  }
}
</style>