<script setup lang="ts">
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../../store/window';
import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButtonGroup,
} from 'element-plus';
import { useFonts } from './hooks/fonts';
import { Window, WindowEvent, CloseButton, Text } from '../../..';
import { ref } from 'vue';
import IconSearch from '../../../../assets/svg/icon-search.svg';
import IconAdd from '../../../../assets/svg/icon-add.svg';
import IconEdit from '../../../../assets/svg/icon-edit.svg';
import IconPin from '../../../../assets/svg/icon-pin.svg';
import IconPinSlash from '../../../../assets/svg/icon-pin-slash.svg';
import { isUndefined } from '../../../../core/is';
import { useReadColorStore } from '../../../../store/read-color';
import { useReadColor } from './hooks/read-color';
import { BackgroundSize } from '../../../../core/window/default-read-style';

const { isDark } = storeToRefs(useWindowStore());
const {
  textColor,
  backgroundColor,
  fontFamily,
  fontName,
  fontWeight,
  bookmarkColorOdd,
  bookmarkColorEven,
  readAloudColor,
  texture,
  previewBackgroundImage,
  previewBackgroundSize,
} = storeToRefs(useSettingsStore());
const { readStyle, setReadColor } = useSettingsStore();

const readColorStore = useReadColorStore();
const { imageMap } = readColorStore;
const { readColors } = storeToRefs(readColorStore);

const fontWindow = ref<WindowEvent>();
const fontQuery = ref('');
const {
  showValue,
  isLoading,
  openFontSelectWindow,
  use: useFont,
  isPinFontWindow,
} = useFonts(fontWindow, fontQuery);

const readColorWindow = ref<WindowEvent>();
const {
  readColorForm,
  showColorPicker,
  colorPickerOnInput,
  isEdit,
  showEditBtn,
  showAddWindow,
  showEditWindow,
  putCustomReadColor,
  deleteCustomReadColor,
  addBackgroundImage,
  removeBackgroundImage,
  colorInputRef,
} = useReadColor(readColorWindow);

</script>
<script lang="ts">
export default {
  name: 'SettingsReadStyle'
}
</script>

<template>
  <div class="settings-read-style">
    <div class="preview">
      <div
        v-memo="[isDark, textColor, backgroundColor, bookmarkColorOdd, bookmarkColorEven, readAloudColor, fontWeight, fontFamily, texture, previewBackgroundImage, previewBackgroundSize]"
        :class="[
          'preview-box',
          texture,
        ]" :style="{
          color: isDark ? 'var(--rc-text-color)' : textColor,
          backgroundColor: isDark ? 'var(--rc-main-color)' : backgroundColor,
          fontWeight,
          '--font-family': fontFamily,
          '--bookmark-odd': isDark ? 'var(--rc-bookmark-odd-color)' : bookmarkColorOdd,
          '--bookmark-even': isDark ? 'var(--rc-bookmark-even-color)' : bookmarkColorEven,
          '--read-aloud': isDark ? 'var(--rc-read-aloud-color)' : readAloudColor,
          backgroundImage: previewBackgroundImage,
          backgroundSize: previewBackgroundSize
        }">
        <p v-once>Aa</p>
        <p v-once>
          <span class="bookmark-odd">这是</span>
          <text>一段</text>
          <span class="bookmark-even">文字</span>
        </p>
        <p v-once class="read-aloud">一段正在朗读的文字</p>
      </div>
    </div>
    <SettingsCard>
      <template #header>
        <span v-once class="title">颜色</span>
        <div>
          <ElButton v-once title="添加" circle size="small" type="primary" :icon="IconAdd" @click="showAddWindow" />
          <ElButton v-once title="编辑" circle size="small" type="primary" :icon="IconEdit" @click="showEditBtn = !showEditBtn" />
        </div>
      </template>
      <ul class="read-colors-list rc-scrollbar">
        <li v-for="item of readColors" :key="item.id">
          <div :class="[item.id === readStyle.background.id ? 'selected' : '']" @click="setReadColor(item)">
            <div
              class="mask"
              v-show="showEditBtn && !item.builtIn"
              @click="e => showEditWindow(e, item)"
            >
              <IconEdit />
            </div>
            <div :style="{
              backgroundColor: item.backgroundColor,
              backgroundImage: imageMap.get(item.id) ? `url(${imageMap.get(item.id)?.url})` : '',
              backgroundSize: item.backgroundImage?.size
            }">
              <span :style="{
                color: item.textColor
              }">Aa</span>
            </div>
          </div>
          <p class="rc-text-ellipsis" :title="item.name">{{ item.name }}</p>
        </li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
        <li v-once class="hide"></li>
      </ul>
      <Window
        class-name="read-color-window"
        width="300"
        height="400"
        toBody
        destroyOnClose
        :clickHide="false"
        centerX
        centerY
        @event="e => readColorWindow = e"
      >
        <section>
          <header>
            <div class="name">
              <span>名称</span>
              <ElInput v-model="readColorForm.name" placeholder="请输入名称" />
            </div>
            <CloseButton @click="readColorWindow?.hide()" />
          </header>
          <main>
            <div class="preview" @click="e => showColorPicker(e, 'backgroundColor')" :style="{
              backgroundColor: readColorForm.backgroundColor,
              backgroundImage: readColorForm.backgroundImage ? `url(${readColorForm.backgroundImage.image})` : '',
              backgroundSize: readColorForm.backgroundImage ? readColorForm.backgroundImage.size : '',
            }">
              <p
                @click="e => showColorPicker(e, 'readAloudColor')"
                class="read-aloud"
                :style="{
                  color: readColorForm.readAloudColor
                }"
              >一段正在朗读的文字</p>
              <p
                @click="e => showColorPicker(e, 'textColor')"
                class="normal"
                :style="{
                  color: readColorForm.textColor
                }"
              >这是一段文字</p>
              <p
                :style="{
                  color: readColorForm.textColor
                }"
                @click="e => e.stopPropagation()"
              >带有<span
                @click="e => showColorPicker(e, 'bookmarkColor.odd')"
                class="bookmark-odd"
                :style="{
                  color: readColorForm.bookmarkColor.odd
                }"
                >书签(odd)</span>与<span
                @click="e => showColorPicker(e, 'bookmarkColor.even')"
                class="bookmark-even"
                :style="{
                  color: readColorForm.bookmarkColor.even
                }"
                >书签(even)
              </span>的文字</p>
            </div>
            <div class="options">
              <div class="btns">
                <ElButtonGroup>
                  <ElButton type="primary" @click="addBackgroundImage">添加背景图片</ElButton>
                  <ElButton type="danger" @click="removeBackgroundImage">移除背景图片</ElButton>
                </ElButtonGroup>
              </div>
              <ul v-if="readColorForm.backgroundImage?.image">
                <li>
                  <span>大小</span>
                  <ElSelect v-model="readColorForm.backgroundImage.size">
                    <ElOption label="cover" :value="BackgroundSize.COVER" />
                    <ElOption label="contain" :value="BackgroundSize.CONTAIN" />
                    <ElOption label="stretch" :value="BackgroundSize.STRETCH" />
                  </ElSelect>
                </li>
                <li>
                  <span>标题栏模糊</span>
                  <ElSelect v-model="readColorForm.backgroundImage.blur">
                    <ElOption label="none" value="" />
                    <ElOption label="light" value="light" />
                    <ElOption label="dark" value="dark" />
                  </ElSelect>
                </li>
              </ul>
            </div>
          </main>
          <footer>
            <div>
              <input type="color" ref="colorInputRef" class="color-picker" @input="colorPickerOnInput" />
            </div>
            <div class="btns">
              <ElButton type="primary" v-if="!isEdit" @click="putCustomReadColor">添加</ElButton>
              <template v-else>
                <ElButton type="danger" @click="deleteCustomReadColor">删除</ElButton>
                <ElButton type="primary" @click="putCustomReadColor">保存</ElButton>
              </template>
            </div>
          </footer>
        </section>
      </Window>
    </SettingsCard>
    <SettingsCard title="背景">
      <SettingsCardItem title="纹理">
        <ElSelect v-model="readStyle.texture">
          <ElOption value="none" label="无" />
          <ElOption value="matte-texture" label="磨砂纹理" />
          <ElOption value="white-texture" label="白色纹理" />
          <ElOption value="wood-texture" label="木材纹理" />
        </ElSelect>
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard title="文本">
      <SettingsCardItem title="字体">
        <ElInput v-model="fontName" readonly>
          <template #append>
            <ElButton @click="openFontSelectWindow">选择</ElButton>
          </template>
        </ElInput>
        <Window class-name="fonts-window" width="300" height="250" toBody destroyOnClose centerX centerY
          :isLoading="isLoading" @event="e => fontWindow = e" :click-hide="!isPinFontWindow">
          <div class="fonts-window-container">
            <header>
              <ElInput v-model="fontQuery" clearable :prefix-icon="IconSearch" />
              <button :title="isPinFontWindow ? '取消固定' : '固定'" @click="isPinFontWindow = !isPinFontWindow">
                <IconPin v-if="!isPinFontWindow" />
                <IconPinSlash v-else />
              </button>
            </header>
            <ul class="fonts-list rc-scrollbar" v-memo="[showValue, readStyle.font.family]">
              <li v-for="item of showValue" :key="item.family" :class="[readStyle.font.family === item.family ? 'select-font' : '']" @click="useFont(item)">
                <Text ellipsis max-width="100%" :title="item.fullName">{{ item.fullName }}</Text>
              </li>
            </ul>
          </div>
        </Window>
      </SettingsCardItem>
      <SettingsCardItem title="粗细">
        <ElSelect style="width: 100px" v-model="readStyle.fontWeight" placeholder="请选择代理协议" size="small">
          <ElOption v-for="item of ['normal', 'bold']" :key="item" :label="item" :value="item" />
        </ElSelect>
      </SettingsCardItem>
      <SettingsCardItem title="大小">
        <ElInputNumber v-model="readStyle.fontSize" @change="cur => readStyle.fontSize = isUndefined(cur) ? 17.5 : cur"
          size="small" :value-on-clear="17.5" :min="12" :max="80" :step="0.5" />
      </SettingsCardItem>
      <SettingsCardItem title="行间距">
        <ElInputNumber v-model="readStyle.lineSpacing"
          @change="cur => readStyle.lineSpacing = isUndefined(cur) ? 2 : cur" size="small" :value-on-clear="2" :min="1"
          :max="10" :step="0.5" />
      </SettingsCardItem>
      <SettingsCardItem title="文本间距">
        <ElInputNumber v-model="readStyle.letterSpacing"
          @change="cur => readStyle.letterSpacing = isUndefined(cur) ? 1.5 : cur" size="small" :value-on-clear="1.5"
          :min="1" :max="10" :step="0.5" />
      </SettingsCardItem>
      <SettingsCardItem title="段落间距">
        <ElInputNumber v-model="readStyle.sectionSpacing"
          @change="cur => readStyle.sectionSpacing = isUndefined(cur) ? 13 : cur" size="small" :value-on-clear="13"
          :min="1" :max="30" :step="0.5" />
      </SettingsCardItem>
      <SettingsCardItem title="宽度">
        <ElInputNumber v-model="readStyle.width"
          @change="cur => readStyle.width = isUndefined(cur) ? 0.8 : cur" size="small" :value-on-clear="1"
          :min="0.1" :max="1" :step="0.1" />
      </SettingsCardItem>
    </SettingsCard>
  </div>
</template>
<style lang="scss">
.fonts-window {

  .fonts-window-container {
    $input-height: 30px;
    $padding: 10px;
    padding: $padding 0 $padding $padding;

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $padding;
      width: calc(100% - $padding);

      .el-input {
        width: calc(100% - 30px);
        height: $input-height;

        .el-input__wrapper {
          .el-input__inner[type="text"] {
            height: $input-height - $padding !important;
          }
        }
      }
      button {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.15);
        }
        &:active {
          transform: scale(0.95);
        }

        svg {
          width: 18px;
          height: 18px;
        }
      }
    }
    

    .fonts-list {
      padding-right: $padding - 7px;
      height: 250px - $padding * 3 - $input-height;

      li {
        display: flex;
        align-items: center;
        padding: 2px 10px;
        margin-bottom: 2px;
        border-radius: 5px;
        transition: all 0.3s ease;
        font-size: 14px;

        &.select-font {
          color: var(--rc-theme-color);
        }
        &:hover {
          background-color: var(--rc-button-hover-bgcolor);
          cursor: pointer;
        }

        &:active {
          transform: scale(0.98);
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
.read-color-window {

  section {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    height: calc(100% - 20px);
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      div.name {
        display: flex;
        align-items: center;
      }
      .el-input {
        margin-left: 10px;
        width: 130px;
        .el-input__wrapper {
          padding: 4px;

          .el-input__inner {
            height: 20px;
          }
        }
      }
    }

    main {
      margin: 10px 0;
      width: 100%;
      height: 300px;

      .preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        height: 150px;
        margin-bottom: 10px;
        background-repeat: no-repeat;
        background-position: center;
        cursor: pointer;
        p {
          margin-bottom: 10px;
          &:last-child {
            margin-bottom: 0;
          }
          cursor: default;
        }
        p.read-aloud,
        p.normal,
        span.bookmark-odd,
        span.bookmark-even {
          &:hover {
            cursor: pointer;
            border-bottom: 1px solid currentColor;
          }
        }
      }
      .options {
        .btns {
          margin-bottom: 10px;
          .el-button-group {
            width: 100%;

            .el-button {
              width: 50%;
            }
          }
        }
        .el-select {
          width: calc(100% - 80px);
        }
        ul {
          li {
            display: flex;
            align-items: center;
            &+li {
              margin-top: 5px;
            }
            span {
              width: 80px;
              font-size: 14px;
            }
          }
        }
      }
    }
    footer {
      display: flex;
      justify-content: space-between;

      .color-picker {
        position: absolute;
        top: 200px;
        visibility: hidden;
      }
    }
  }

  .el-color-picker {
    width: 0;
    height: 0;
    visibility: hidden;
  }
}
</style>
<style scoped lang="scss">
.settings-read-style {
  :deep(.el-input) {
    height: 30px;
    font-size: 14px;

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 20px !important;
        cursor: default;
      }
    }
  }

  :deep(.el-select) {
    min-width: 100px;
    .el-select__wrapper {
      font-size: 14px;
      height: 30px;
      line-height: 30px;
    }
  }
  

  .preview {
    margin: 10px 0 20px 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-box {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 180px;
      height: 100px;
      border-radius: 10px;
      background-repeat: no-repeat;
      background-position: center;

      * {
        font-family: var(--font-family);
      }


      p {
        display: flex;
        justify-content: center;
        width: 100%;
      }

      p.read-aloud {
        color: var(--read-aloud);
      }

      span.bookmark-odd {
        color: var(--bookmark-odd);
        border-bottom: 1.5px solid currentColor;
      }

      span.bookmark-even {
        color: var(--bookmark-even);
        border-bottom: 1.5px solid currentColor;
      }
    }
  }

  .read-colors-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    max-height: 178px;
    li {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-bottom: 5px;
      padding: 2px;
      width: 60px;
      height: 80px;

      div {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      &>div {
        position: relative;
        padding: 2px;
        border-radius: 10px;
        cursor: pointer;
        .mask {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.8);
          color: #FFFFFF;
        }
        div {
          width: 50px;
          height: 50px;
          border-radius: 6px;

          span {
            font-size: 17px;
          }
        }

        &.selected {
          border: 2px solid var(--rc-theme-color);

          & + p {
            color: var(--rc-theme-color);
          }
        }
      }

      & > p {
        margin-top: 5px;
        max-width: 100%;
      }
      &.hide {
        padding: 0;
        height: 0;
        margin-bottom: 0;
        width: 64px;
      }
    }
  }
}
</style>