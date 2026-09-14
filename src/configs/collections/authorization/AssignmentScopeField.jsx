import { defineComponent, h, onMounted, ref } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
import { t } from '@/i18n'
import request from '@/utils/request'
import { apiPath, API_PREFIX } from '@/api/prefix'

export default defineComponent({
  name: 'AssignmentScopeField',
  props: { form: { type: Object, default: () => ({}) }},
  setup(props) {
    const options = ref([])
    const global = () => props.form.scopeType === 'global'
    onMounted(async() => {
      try {
        const response = await request.get(apiPath(API_PREFIX, 'manage/stores'), { params: { limit: 200, '@order': 'entity.id|DESC' }})
        const payload = response?.data ?? response
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
        options.value = list.filter((store) => store?.uuid).map((store) => ({
          value: store.uuid,
          label: store.code ? `${store.name || store.code} (${store.code})` : (store.name || store.uuid)
        }))
      } catch (error) {
        // Keep the selector usable if the store dictionary is unavailable.
      }
    })
    return () => {
      if (global()) props.form.scopeUuid = null
      return h(ElSelect, {
        modelValue: props.form.scopeUuid || '',
        'onUpdate:modelValue': (value) => { props.form.scopeUuid = value || null },
        clearable: true,
        filterable: true,
        disabled: global(),
        placeholder: global() ? t('No scope needed for global') : t('Please select a store'),
        style: 'width:100%'
      }, () => options.value.map((option) => h(ElOption, option)))
    }
  }
})
