import { g, r } from '@/router/generator'
import Layout from '@/layout'

export default [
  // Content manage
  {
    path: '/content', name: 'ContentManage', component: Layout,
    meta: { title: '内容管理', icon: 'el-icon-document', roles: ['ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', '内容')
    ]
  },

  // User manage
  {
    path: '/user', name: 'UserManage', component: Layout,
    meta: { title: '用户管理', icon: 'el-icon-user', roles: ['ROLE_SUPER_ADMIN'] },
    children: [
      ...g('User', '用户'),
      ...r('UserProfile', '资料')
    ]
  },

  // System manage
  {
    path: '/system', name: 'SystemManage', component: Layout,
    meta: { title: '系统选项', icon: 'el-icon-setting', roles: ['ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Type', '词汇表'),
      ...r('Category', '分类'),
      ...r('Album', '相册'),
      ...r('Picture', '图片'),
      ...r('Option', '配置')
    ]
  }
]
