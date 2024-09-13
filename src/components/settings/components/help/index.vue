<script setup lang="ts">
import { ElLink } from 'element-plus';
import { description } from '../../../../../package.json';
import { useLog } from './hooks/log';
import { useUpdateStore } from '../../../../store/update';

const { version, branch, commit, date } = METADATA;
const { chrome, electron, node, v8 } = process.versions;

const { exportLog } = useLog();
const { update, getUpdateLog } = useUpdateStore();

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
        <tbody>
          <tr>
            <td>版本</td>
            <td class="version">
              <span>{{ `${version}${branch === 'dev' ? '.' + date : ''}` }}</span>
              <div>
                <ElLink type="primary" :underline="false" @click="update(true)">检查更新</ElLink>
                <ElLink type="primary" :underline="false" @click="getUpdateLog">更新日志</ElLink>
                <ElLink type="primary" :underline="false" @click="exportLog">导出日志</ElLink>
              </div>
            </td>
          </tr>
          <tr>
            <td>作者</td>
            <td>Moomew</td>
          </tr>
          <tr>
            <td>官网</td>
            <td>
              <ElLink href="https://read-cat.top" target="_blank">https://read-cat.top</ElLink>
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
        </tbody>
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

        &>span {
          user-select: text;
        }

        &>div {
          display: flex;
          align-items: center;
        }

        :deep(.el-link) {
          color: var(--rc-theme-color);
          transition: scale 0.3s ease;

          &:active {
            transform: scale(0.95);
          }

          &+.el-link {
            margin-left: 10px;
          }

          span {
            font-size: 13px;
          }
        }
      }

      tr {
        td {
          &:first-child {
            padding-right: 20px;
          }

          &:last-child {
            user-select: text;
          }
        }
      }
    }
  }
}

@media screen and (max-width: 800px) {
  .settings-help {
    main {
      width: 80%;
    }
  }
}
</style>