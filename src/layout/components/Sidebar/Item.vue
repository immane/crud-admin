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
            h(resolveComponent(icon), { class: 'sub-el-icon' })
          )
        } else {
          vnodes.push(h(resolveComponent('svg-icon'), { iconClass: icon }))
        }
      }

      if (title) {
        vnodes.push(h('span', null, title))
      }
      return vnodes
    }
  }
}
</script>

<style scoped>
.sub-el-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
