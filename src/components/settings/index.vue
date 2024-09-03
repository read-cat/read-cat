<script setup lang="ts">
import {
  ElIcon,
  ElPopover,
  ElDivider
} from 'element-plus';
import { ref, watch } from 'vue';
import IconSettingsConfig from '../../assets/svg/icon-settings-config.svg';
import IconSettingsProxy from '../../assets/svg/icon-settings-proxy.svg';
import IconSettingsReadStyle from '../../assets/svg/icon-settings-read-style.svg';
import IconSettingsShortcutKey from '../../assets/svg/icon-settings-shortcut-key.svg';
import IconSettingsPlugins from '../../assets/svg/icon-settings-plugins.svg';
import IconSettingsAbout from '../../assets/svg/icon-settings-about.svg';
import IconAttention from '../../assets/svg/icon-attention.svg';
import IconOpenBook from '../../assets/svg/icon-open-book.svg';
import SettingsNavItem from './components/nav-item/index.vue';
import SettingsConfig from './components/config/index.vue';
import SettingsPlugin from './components/plugin/index.vue';
import SettingsProxy from './components/proxy/index.vue';
import SettingsReadStyle from './components/read-style/index.vue';
import SettingsShortcutKey from './components/shortcut-key/index.vue';
import SettingsHelp from './components/help/index.vue';
import SettingsTxtParseRule from './components/txt-parse-rules/index.vue';
import { WindowEvent } from '../window/index.vue';
import { useSettingsStore } from '../../store/settings';
import { CloseButton } from '..';

defineProps<{
  window?: WindowEvent
}>();
const { options } = useSettingsStore();
enum SettingsLabel {
  CONFIG = '应用',
  PLUGIN = '插件',
  PROXY = '代理',
  READ_STYLE = '阅读样式',
  SHORTCUT_KEY = '快捷键',
  TXT_PARSE_RULE = 'TXT解析规则',
  ABOUT = '关于'
}
const navItemSelected = ref('应用');

watch(() => navItemSelected.value, () => {
  const main = document.querySelector('#settings-main');
  main && main.scrollTo({
    top: 0,
    behavior: 'instant'
  });
});
</script>
<script lang="ts">
export default {
  name: 'Settings'
}
</script>

<template>
  <div class="container">
    <nav>
      <ul>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.CONFIG">
          <ElIcon size="18"><IconSettingsConfig /></ElIcon>
        </SettingsNavItem>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.PLUGIN">
          <ElIcon size="18"><IconSettingsPlugins /></ElIcon>
        </SettingsNavItem>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.PROXY">
          <ElIcon size="18"><IconSettingsProxy /></ElIcon>
        </SettingsNavItem>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.READ_STYLE">
          <ElIcon size="18"><IconSettingsReadStyle /></ElIcon>
        </SettingsNavItem>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.SHORTCUT_KEY">
          <ElIcon size="18"><IconSettingsShortcutKey /></ElIcon>
        </SettingsNavItem>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.TXT_PARSE_RULE">
          <ElIcon size="18"><IconOpenBook /></ElIcon>
        </SettingsNavItem>
        <SettingsNavItem v-memo="[navItemSelected]" v-model="navItemSelected" :label="SettingsLabel.ABOUT">
          <ElIcon size="18"><IconSettingsAbout /></ElIcon>
        </SettingsNavItem>
      </ul>
      <ElPopover v-once placement="bottom-start" trigger="hover" :width="350" title="提示" :persistent="false">
        <template #reference>
          <IconAttention />
        </template>
        <template #default>
          <p>修改设置后请勿在5秒内退出程序, 否则设置项将不生效</p>
        </template>
      </ElPopover>
    </nav>
    <section>
      <header>
        <div class="title">
          <h4 v-memo="[navItemSelected]">{{ navItemSelected }}</h4>
          <CloseButton margin-right="20" @click="window?.hide()" />
        </div>
        <ElDivider v-once />
      </header>
      <main id="settings-main" :class="['rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">
        <SettingsConfig v-if="navItemSelected === SettingsLabel.CONFIG" />
        <SettingsPlugin v-else-if="navItemSelected === SettingsLabel.PLUGIN" />
        <SettingsProxy v-else-if="navItemSelected === SettingsLabel.PROXY" />
        <SettingsReadStyle v-else-if="navItemSelected === SettingsLabel.READ_STYLE" />
        <SettingsShortcutKey v-else-if="navItemSelected === SettingsLabel.SHORTCUT_KEY" />
        <SettingsTxtParseRule v-else-if="navItemSelected === SettingsLabel.TXT_PARSE_RULE" />
        <SettingsHelp v-else-if="navItemSelected === SettingsLabel.ABOUT" />
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    width: 150px;
    height: calc(100% - 20px);
  }

  section {
    padding: 10px 0 10px 20px;
    width: calc(100% - 190px);
    background-color: var(--rc-settings-window-bgcolor);

    header {
      height: 40px;

      :deep(.el-divider) {
        margin: 10px 20px 0 0;
        width: calc(100% - 20px);
      }

      div.title {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    main {
      max-height: calc(100% - 40px);

      :deep(.el-switch) {
        --el-switch-on-color: var(--rc-theme-color);
        height: 20px;
      }

      :deep(.el-input) {

        .el-input__wrapper {
          padding: 0 5px;

          .el-input__inner {
            height: 20px;
          }
        }
      }
    }
  }
}
</style>