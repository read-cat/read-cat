<script setup lang="ts">
import {
  ElSwitch,
  ElInputNumber,
  ElDivider,
  ElInput,
  ElButton,
  ElSlider,
  ElAutocomplete,
} from 'element-plus';
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { storeToRefs } from 'pinia';
import { isBoolean, isUndefined } from '../../../../core/is';
import ThemeItem from './components/theme-item/index.vue';
import { SettingsTheme } from '../../../../store/defined/settings';
import { useCache } from './hooks/cache';
import IconDelete from '../../../../assets/svg/icon-delete.svg';
import { useWindowTransparent } from './hooks/window-transparent';
import { Core } from '../../../../core';
import { useGithubDownloadProxy } from './hooks/github-download-proxy';

const { platform } = process;
const { options, setTheme, window: windowConfig, readAloud, update } = useSettingsStore();
const {
  threadsNumber,
  maxCacheChapterNumber,
  theme,
  scrollbarStepValue,
  debug,
} = storeToRefs(useSettingsStore());

const themeChange = (val: SettingsTheme) => {
  setTheme(val);
}

const {
  cacheSize,
  clearCache
} = useCache();

const {
  windowTransparentSwitchIsLoading,
  windowTransparentSwitchChange,
  windowTransparentSwitchBeforeChange,
  transparentWindowHelp
} = useWindowTransparent();

const debugChange = (val: string | number | boolean) => {
  const is = isBoolean(val) ? val : !!val;
  Core.isDev = is;
  Core.logger.setDebug(is);
}

const { querySearch } = useGithubDownloadProxy();
</script>
<script lang="ts">
export default {
  name: 'SettingsConfig'
}
</script>

<template>
  <div class="settings-config">
    <SettingsCard title="主题">
      <div class="theme">
        <ThemeItem v-model="theme" @change="themeChange" type="os" />
        <ThemeItem v-model="theme" @change="themeChange" type="light" />
        <ThemeItem v-model="theme" @change="themeChange" type="dark" />
      </div>
    </SettingsCard>
    <SettingsCard title="软件更新">
      <SettingsCardItem title="启动时检测更新" v-memo="[options.enableAppStartedFindNewVersion]">
        <ElSwitch :validate-event="false" v-model="options.enableAppStartedFindNewVersion" />
      </SettingsCardItem>
      <SettingsCardItem v-if="platform === 'win32'" title="Github加速下载" help="若开启代理，则优先走代理连接" v-memo="[update.downloadProxy]">
        <ElAutocomplete
          v-model="update.downloadProxy"
          :fetch-suggestions="querySearch"
          clearable
        />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard title="朗读">
      <SettingsCardItem title="自动朗读下一章节" v-memo="[options.enableAutoReadAloudNextChapter]" help="当前章节朗读结束后自动朗读下一章节">
        <ElSwitch :validate-event="false" v-model="options.enableAutoReadAloudNextChapter" />
      </SettingsCardItem>
      <SettingsCardItem title="最大行字数" v-memo="[readAloud.maxLineWordCount]" help="适当调节该数值可改善朗读体验, 但会导致内容衔接停顿">
        <ElInputNumber v-model="readAloud.maxLineWordCount"
          @change="cur => readAloud.maxLineWordCount = Math.floor(isUndefined(cur) ? 500 : cur)" size="small"
          :value-on-clear="500" :min="100" :max="1000" :step="50" />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard title="界面">
      <SettingsCardItem v-memo="[options.enableBlur]" title="模糊效果" help="部分界面显示模糊效果">
        <ElSwitch :validate-event="false" v-model="options.enableBlur" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableTransition]" title="过渡动画" help="部分场景显示过渡动画">
        <ElSwitch :validate-event="false" v-model="options.enableTransition" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableReadBacktop]" title="显示阅读页面回到顶部按钮" help="仅阅读界面有效, 其他界面不受此选项影响">
        <ElSwitch :validate-event="false" v-model="options.enableReadBacktop" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableShowTipCloseButton]" title="显示消息提示框关闭按钮">
        <ElSwitch :validate-event="false" v-model="options.enableShowTipCloseButton" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableBookmarkHighlight]" title="书签高亮" help="仅阅读界面生效">
        <ElSwitch :validate-event="false" v-model="options.enableBookmarkHighlight" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableAutoTextColor]" title="文本颜色自适应" help="仅阅读界面生效">
        <ElSwitch :validate-event="false" v-model="options.enableAutoTextColor" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableScrollToggleChapter]" title="滚动切换章节" help="仅阅读界面生效">
        <ElSwitch :validate-event="false" v-model="options.enableScrollToggleChapter" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableTransparentWindow]" title="透明窗口" :help="transparentWindowHelp">
        <ElSwitch :validate-event="false" :before-change="windowTransparentSwitchBeforeChange"
          :loading="windowTransparentSwitchIsLoading" @change="windowTransparentSwitchChange" v-model="options.enableTransparentWindow" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[options.enableShowToggleChapterButton]" title="显示章节切换按钮" help="章节标题处显示章节切换按钮，仅阅读界面生效">
        <ElSwitch :validate-event="false" v-model="options.enableShowToggleChapterButton" />
      </SettingsCardItem>
      <ElDivider />
      <SettingsCardItem v-memo="[scrollbarStepValue]" title="快捷键滚动步进值" help="仅快捷键向上/下滚动时生效">
        <ElInputNumber v-model="scrollbarStepValue"
          @change="cur => scrollbarStepValue = Math.floor(isUndefined(cur) ? 300 : cur)" size="small"
          :value-on-clear="300" :min="50" :max="5000" :step="50" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[windowConfig.opacity]" title="窗口不透明度" help="仅开启透明窗口后生效, 为0时只背景透明">
        <ElSlider v-model="windowConfig.opacity" size="small" show-stops :value-on-clear="0.8" :min="0" :max="1"
          :step="0.1" />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard title="任务">
      <SettingsCardItem v-memo="[threadsNumber]" title="任务执行数" help="数值越大某些场景下执行速度越快">
        <ElInputNumber v-model="threadsNumber" @change="cur => threadsNumber = Math.floor(isUndefined(cur) ? 8 : cur)"
          size="small" :value-on-clear="8" :min="1" :max="32" :step="1" />
      </SettingsCardItem>
      <SettingsCardItem v-memo="[maxCacheChapterNumber]" title="章节最大缓存数"
        help="仅支持已加入书架的书本<br>向下缓存章节, 如当前阅读至第10章, 则后台自动缓存第10章至第(10 + N)章<br>若N为0, 则只缓存第10章">
        <ElInputNumber v-model="maxCacheChapterNumber"
          @change="cur => maxCacheChapterNumber = Math.floor(isUndefined(cur) ? 10 : cur)" size="small"
          :value-on-clear="10" :min="0" :max="5000" :step="1" />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard>
      <template #header>
        <span v-once class="title">缓存</span>
        <ElButton circle type="danger" size="small" :icon="IconDelete" @click="clearCache" />
      </template>
      <SettingsCardItem v-memo="[cacheSize]" title="当前缓存大小">
        <ElInput v-model="cacheSize" readonly :formatter="(size: number) => (size / 1024 / 1024).toFixed(2) + ' MB'" />
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard title="高级">
      <SettingsCardItem title="调试模式">
        <ElSwitch :validate-event="false" v-model="debug" @change="debugChange" />
      </SettingsCardItem>
    </SettingsCard>
  </div>
</template>

<style scoped lang="scss">
.theme {
  display: flex;
  flex-wrap: wrap;

  &>div {
    margin-right: 10px;

    &:last-child {
      margin-right: 0;
    }
  }

}

.settings-config {
  :deep(.el-input) {
    height: 30px;

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 20px !important;
        text-align: center;

        &[type="number"] {
          font-size: 14px;
        }
      }
    }
  }
  :deep(.el-autocomplete) {
    width: 200px;
  }
  :deep(.el-slider) {
    min-width: 200px;
  }
}
</style>