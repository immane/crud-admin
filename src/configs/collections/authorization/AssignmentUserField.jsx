import { defineComponent, h, onMounted, ref } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
import { t } from '@/i18n'
import request from '@/utils/request'
import { apiPath, API_PREFIX } from '@/api/prefix'

export default defineComponent({
  name: 'AssignmentUserField',
  props: { form: { type: Object, default: () => ({}) }},
  setup(props) {
    const options = ref([])
    const loading = ref(false)
    const load = async(keyword = '') => {
      loading.value = true
      try {
        const params = { limit: 50, '@order': 'entity.id|DESC' }
        if (keyword.trim()) params['@filter'] = `entity.username matches "${keyword.trim()}"`
        const response = await request.get(apiPath(API_PREFIX, 'manage/users'), { params })
        const payload = response?.data ?? response
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
        options.value = list.filter((user) => user?.uuid).map((user) => ({
          value: user.uuid,
          label: user.username || user.email || user.phone || user.uuid
        }))
      } catch (error) {
        options.value = []
      } finally {
        loading.value = false
      }
    }
    onMounted(() => load())
    return () => h(ElSelect, {
      modelValue: props.form.userUuid || '',
      'onUpdate:modelValue': (value) => { props.form.userUuid = value || null },
      clearable: true,
      filterable: true,
      remote: true,
      'remote-method': load,
      loading: loading.value,
      placeholder: t('Search username to select user'),
      style: 'width:100%'
    }, () => options.value.map((option) => h(ElOption, option)))
  }
})
