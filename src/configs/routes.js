import { r } from '@/router/generator'
import Layout from '@/layout'

export default [
  {
    path: '/product', name: 'ProductManage', component: Layout,
    meta: { title: 'Product Management', icon: 'el-icon-goods', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Product', 'Product')
    ]
  },

  {
    path: '/order', name: 'OrderManage', component: Layout,
    meta: { title: 'Order Management', icon: 'el-icon-tickets', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Order', 'Order'),
      ...r('Invoice', 'Invoice'),
      ...r('OrderItem', 'Order Item')
    ]
  },

  {
    path: '/promotion', name: 'PromotionManage', component: Layout,
    meta: { title: 'Promotion Management', icon: 'el-icon-s-promotion', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Promotion', 'Promotion'),
      ...r('PromotionTemplate', 'Promotion Template')
    ]
  },

  {
    path: '/content', name: 'ContentManage', component: Layout,
    meta: { title: 'Content Management', icon: 'el-icon-notebook', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', 'Content'),
      ...r('Page', 'Page'),
      ...r('Comment', 'Comment'),
      ...r('Media', 'Media')
    ]
  },

  {
    path: '/wallet', name: 'WalletManage', component: Layout,
    meta: { title: 'Wallet Management', icon: 'el-icon-wallet', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Wallet', 'Wallet'),
      ...r('WalletTransaction', 'Transaction'),
      ...r('WalletPaymentDeduction', 'Payment Deduction')
    ]
  },

  {
    path: '/user', name: 'UserManage', component: Layout,
    meta: { title: 'User Management', icon: 'el-icon-user', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('User', 'User'),
      ...r('Profile', 'Profile'),
      ...r('WechatUser', 'Wechat User')
    ]
  },

  {
    path: '/system-option', name: 'SystemOptionManage', component: Layout,
    meta: { title: 'System Options', icon: 'el-icon-setting', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Category', 'Category'),
      ...r('Tag', 'Tag'),
      ...r('Setting', 'Setting')
    ]
  }
]
