<script lang="jsx">
import { h, resolveComponent } from 'vue'

export default {
  name: 'MenuItem',
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const { icon, title } = props

    return () => {
      const vnodes = []

      if (icon) {
        if (icon.includes('el-icon')) {
          vnodes.push(
            h('el-icon', { style: { marginRight: title ? '8px' : '0' } }, () => [
              h(resolveComponent(icon))
            ])
          )
        } else {
          vnodes.push(h(resolveComponent('svg-icon'), { iconClass: icon }))
        }
      }

      if (title) {
        vnodes.push(h('span', { class: 'menu-item-title' }, title))
      }
      return vnodes
    }
  }
}
</script>
