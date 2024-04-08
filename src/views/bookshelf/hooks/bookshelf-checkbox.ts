import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useBookshelfStore } from '../../../store/bookshelf';
import { CheckboxValueType } from 'element-plus';

export const useBookshelfCheckbox = () => {
  const checkAll = ref(false);
  const isIndeterminate = ref(false);
  const checkedCities = ref<string[]>([]);
  const { books } = storeToRefs(useBookshelfStore());

  const handleCheckAllChange = (val: CheckboxValueType) => {
    checkedCities.value = val ? books.value.map(b => b.id) : [];
    isIndeterminate.value = false;
  }
  const handleCheckedCitiesChange = (value: CheckboxValueType[]) => {
    const cities = books.value.map(b => b.id);
    checkAll.value = value.length === cities.length;
    isIndeterminate.value = value.length > 0 && value.length < cities.length
  }

  return {
    checkAll,
    checkedCities,
    isIndeterminate,
    handleCheckAllChange,
    handleCheckedCitiesChange
  }
}