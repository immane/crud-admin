import { h } from 'vue'

const legacyIconNames = [
  'el-icon-arrow-left', 'el-icon-arrow-right', 'el-icon-arrow-down',
  'el-icon-back', 'el-icon-caret-bottom', 'el-icon-caret-right',
  'el-icon-plus', 'el-icon-minus', 'el-icon-delete', 'el-icon-edit',
  'el-icon-edit-outline', 'el-icon-view', 'el-icon-search', 'el-icon-download',
  'el-icon-upload', 'el-icon-refresh', 'el-icon-refresh-left', 'el-icon-loading',
  'el-icon-time', 'el-icon-timer', 'el-icon-location-outline', 'el-icon-info',
  'el-icon-s-home', 'el-icon-goods', 'el-icon-s-order', 'el-icon-s-promotion',
  'el-icon-document', 'el-icon-money', 'el-icon-coin', 'el-icon-user',
  'el-icon-setting', 'el-icon-sunny', 'el-icon-partly-cloudy', 'el-icon-cloudy',
  'el-icon-light-rain', 'el-icon-heavy-rain', 'el-icon-lightning', 'el-icon-sort'
]

export default function installLegacyIcons(app) {
  legacyIconNames.forEach(name => {
    app.component(name, {
      name,
      render: () => h('i', { class: name })
    })
  })
}
