import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useBookshelfStore } from '../../../store/bookshelf';
import { CheckboxValueType, ElMessageBox } from 'element-plus';
import { useMessage } from '../../../hooks/message';
import { useTextContentStore } from '../../../store/text-content';
import { useBookmarkStore } from '../../../store/bookmark';
import IconLoadingPlay from '../../../assets/svg/icon-loading-play.svg';

export const useBookshelfCheckbox = () => {
  const checkAll = ref(false);
  const isIndeterminate = ref(false);
  const checkedCities = ref<string[]>([]);
  const bookshelf = useBookshelfStore();
  const bookmark = useBookmarkStore();
  const textContent = useTextContentStore();
  const { books } = storeToRefs(bookshelf);
  const message = useMessage();
  const cities = ref(books.value.map(b => b.id));
  const handleCheckAllChange = (val: CheckboxValueType) => {
    checkedCities.value = val ? books.value.map(b => b.id) : [];
    isIndeterminate.value = false;
  }
  const handleCheckedCitiesChange = (value: CheckboxValueType[]) => {
    const checkedCount = value.length;
    checkAll.value = checkedCount === cities.value.length;
    isIndeterminate.value = checkedCount > 0 && checkedCount < cities.value.length;
  }

  watch(() => books.value, (newVal) => {
    cities.value = newVal.map(b => b.id);
    checkedCities.value = [];
    checkAll.value = false;
    isIndeterminate.value = false;
  }, {
    deep: true,
    immediate: true
  });

  const removeBookshelf = () => {
    if (checkedCities.value.length < 1) {
      message.warning('未选择书本');
      return;
    }
    ElMessageBox.confirm(`已选择${checkedCities.value.length}本书, 是否移出书架?`, '书架', {
      confirmButtonText: '移出',
      cancelButtonText: '取消',
      type: 'info'
    }).then(async () => {
      let error = 0;
      const info = message.info({
        icon: IconLoadingPlay,
        message: '正在将选中书本移出书架',
        duration: 0
      });
      for (const id of checkedCities.value) {
        const book = bookshelf._books.find(b => b.id === id);
        if (!book) {
          continue;
        }
        const { pid, detailPageUrl } = book;
        await bookshelf.remove(id).then(() => {
          return Promise.allSettled([
            textContent.removeTextContentsByPidAndDetailUrl(pid, detailPageUrl),
            bookmark.removeBookmarksByDetailUrl(detailPageUrl)
          ]);
        }).catch(() => error++);
      }
      if (error > 0) {
        info.close();
        message.info(`已移出${checkedCities.value.length - error}本书, ${error}本移出失败`);
        return;
      }
      info.close();
      message.success('已将选中书本移出书架');
    }).catch(() => { });
  }

  return {
    checkAll,
    checkedCities,
    isIndeterminate,
    handleCheckAllChange,
    handleCheckedCitiesChange,
    removeBookshelf
  }
}