import { defineComponent, h, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import request from '@/utils/request'
import { apiPath, API_PREFIX } from '@/api/prefix'

const stores = ref({})
let loading
const loadStores = () => {
  if (loading) return loading
  loading = request.get(apiPath(API_PREFIX, 'manage/stores'), { params: { limit: 200 }}).then((response) => {
    const payload = response?.data ?? response
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
    stores.value = Object.fromEntries(list.filter((store) => store?.uuid).map((store) => [store.uuid, store]))
  }).catch(() => {})
  return loading
}

export default defineComponent({
  name: 'AssignmentScopeLink',
  props: { data: { type: String, default: '' }},
  setup(props) {
    const router = useRouter()
    const resolve = () => loadStores()
    onMounted(resolve)
    watch(() => props.data, resolve)
    return () => {
      const store = stores.value[props.data]
      if (!props.data) return h('span', '-')
      const label = store?.code ? `${store.name || store.code} (${store.code})` : (store?.name || props.data)
      if (store?.id != null && router.hasRoute('StoreDetail')) return h(RouterLink, { to: { name: 'StoreDetail', params: { id: store.id }}, class: 'el-link', title: props.data }, () => label)
      return h('span', { title: props.data }, label)
    }
  }
})
