<script setup lang="ts">
import { ElLink } from 'element-plus';
import { description } from '../../../../../package.json';

const { version, branch, commit, date } = METADATA;
const { chrome, electron, node, v8 } = process.versions;
</script>
<script lang="ts">
export default {
  name: 'SettingsHelp'
}
</script>

<template>
  <div class="settings-help">
    <header>
      <img src="/icons/512x512.png" alt="logo">
      <h3>ReadCat</h3>
      <p class="desc">{{ description }}</p>
    </header>
    <main>
      <table>
        <tr>
          <td>版本</td>
          <td class="version">
            <span>{{ `${version}${branch === 'dev' ? '.' + date : ''}` }}</span>
            <div>
              <ElLink type="primary" :underline="false">检查更新</ElLink>
              <ElLink type="primary" :underline="false">更新日志</ElLink>
            </div>
          </td>
        </tr>
        <tr>
          <td>提交</td>
          <td>{{ commit }}</td>
        </tr>
        <tr>
          <td>Chrome</td>
          <td>{{ chrome }}</td>
        </tr>
        <tr>
          <td>Electron</td>
          <td>{{ electron }}</td>
        </tr>
        <tr>
          <td>Node.js</td>
          <td>{{ node }}</td>
        </tr>
        <tr>
          <td>V8</td>
          <td>{{ v8 }}</td>
        </tr>
      </table>
    </main>
  </div>
</template>

<style scoped lang="scss">
.settings-help {
  display: flex;
  flex-direction: column;
  align-items: center;

  header {
    margin-top: 20px;
    text-align: center;

    img {
      width: 100px;
      height: 100px;
      box-shadow: 0 12px 32px 4px #1e78eb80, 0 8px 20px #1e78eb14;
      border-radius: 35px;
    }

    h3 {
      margin-top: 5px;
      color: var(--rc-theme-color);
    }

    p.desc {
      margin-top: 5px;
      font-size: 13px;
      color: #A1A1A1;
    }
  }

  main {
    margin-top: 20px;
    width: 450px;

    table {
      font-size: 14px;

      .version {
        display: flex;
        align-items: center;
        justify-content: space-between;

        span {
          user-select: text;
        }

        :deep(.el-link) {
          color: var(--rc-theme-color);
        }
      }

      tr {
        td:nth-child(2) {
          text-indent: 1em;
          user-select: text;
        }
      }
    }
  }
}
</style>