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
            h('span', { class: 'sub-el-icon' }, [
              h(resolveComponent(icon))
            ])
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 5px;
  vertical-align: middle;
  flex-shrink: 0;
}
.sub-el-icon :deep(svg) {
  width: 14px;
  height: 14px;
}
</style>
