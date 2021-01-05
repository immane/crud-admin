/* Generator */
import { g, r } from './generator'

/* Layout */
import Layout from '@/layout'

/**
 * Custom Menu
 *
 * Change current section and define your menu and relations here.
 */
export const customRoutes = [
  // Publish manage
  /*
  {
    path: '/publish', name: 'PublishManage', component: Layout,
    meta: { title: 'Post manage', icon: 'el-icon-upload' },
    children: [
      ...g('Post', 'Post title'), // g for Generate custom page handler.
      ...r('Comment', 'Comment title') // r for Redirect default page handler.
    ]
  },
  */

  // Content manage
  {
    path: '/content', name: 'ContentManage', component: Layout,
    meta: { title: '内容管理', icon: 'el-icon-document' },
    children: [
      ...g('Content', '内容')
    ]
  },
  // User manage
  {
    path: '/user', name: 'UserManage', component: Layout,
    meta: { title: '用户管理', icon: 'el-icon-user' },
    children: [
      ...g('User', '用户'),
      ...r('UserProfile', '资料')
    ]
  },
  // System manage
  {
    path: '/system', name: 'SystemManage', component: Layout,
    meta: { title: '系统选项', icon: 'el-icon-setting' },
    children: [
      ...r('Type', '词汇表'),
      ...r('Category', '分类'),
      ...r('Option', '配置')
    ]
  }
]
