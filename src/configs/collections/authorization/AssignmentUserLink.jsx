import { defineComponent, h, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import request from '@/utils/request'
import { apiPath, API_PREFIX } from '@/api/prefix'

const users = ref({})
let loading
const loadUsers = () => {
  if (loading) return loading
  loading = request.get(apiPath(API_PREFIX, 'manage/users'), { params: { limit: 200 }}).then((response) => {
    const payload = response?.data ?? response
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
    users.value = Object.fromEntries(list.filter((user) => user?.uuid).map((user) => [user.uuid, user]))
  }).catch(() => {})
  return loading
}

export default defineComponent({
  name: 'AssignmentUserLink',
  props: { data: { type: String, default: '' }},
  setup(props) {
    const router = useRouter()
    const resolve = () => loadUsers()
    onMounted(resolve)
    watch(() => props.data, resolve)
    return () => {
      const user = users.value[props.data]
      if (!props.data) return h('span', '-')
      if (user?.id != null && router.hasRoute('UserDetail')) return h(RouterLink, { to: { name: 'UserDetail', params: { id: user.id }}, class: 'el-link', title: props.data }, () => user.username || user.email || props.data)
      return h('span', { title: props.data }, user?.username || user?.email || props.data)
    }
  }
})
