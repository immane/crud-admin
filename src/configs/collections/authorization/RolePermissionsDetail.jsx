import { defineComponent, h } from 'vue'
import { ElTag } from 'element-plus'

const permission = (value) => {
  if (typeof value === 'string') return { code: value, name: '' }
  if (!value || typeof value !== 'object') return null
  const code = value.code ?? value.permission?.code ?? value.permissionCode ?? value.key ?? value.value ?? value.__toString
  return typeof code === 'string' && code ? { code, name: value.name || '' } : null
}

export default defineComponent({
  name: 'RolePermissionsDetail',
  props: { data: { type: [Array, String, Object], default: () => [] }},
  setup(props) {
    return () => {
      const values = Array.isArray(props.data) ? props.data : (props.data ? [props.data] : [])
      const seen = new Set()
      const items = values.map(permission).filter((item) => item && !seen.has(item.code) && seen.add(item.code))
      if (!items.length) return h('span', '-')
      return h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;' }, items.map((item) =>
        h(ElTag, { key: item.code, size: 'small', title: item.code }, () => item.name ? `${item.name} (${item.code})` : item.code)
      ))
    }
  }
})
