import { r } from '@/router/generator'
import { t } from '@/i18n'
import Layout from '@/layout'

export default [
  {
    path: '/product', name: 'ProductManage', component: Layout,
    meta: { title: t('Product Management'), icon: 'el-icon-goods', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Product', t('Product'))
    ]
  },

  {
    path: '/order', name: 'OrderManage', component: Layout,
    meta: { title: t('Order Management'), icon: 'el-icon-tickets', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Order', t('Order')),
      ...r('Invoice', t('Invoice')),
      ...r('OrderItem', t('Order Item'))
    ]
  },

  {
    path: '/promotion', name: 'PromotionManage', component: Layout,
    meta: { title: t('Promotion Management'), icon: 'el-icon-s-promotion', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Promotion', t('Promotion')),
      ...r('PromotionTemplate', t('Promotion Template'))
    ]
  },

  {
    path: '/content', name: 'ContentManage', component: Layout,
    meta: { title: t('Content Management'), icon: 'el-icon-notebook', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', t('Content')),
      ...r('Page', t('Page')),
      ...r('Comment', t('Comment')),
      ...r('Media', t('Media')),
      ...r('Picture', t('Picture'))
    ]
  },

  {
    path: '/wallet', name: 'WalletManage', component: Layout,
    meta: { title: t('Wallet Management'), icon: 'el-icon-wallet', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Wallet', t('Wallet')),
      ...r('WalletTransaction', t('Transaction')),
      ...r('WalletPaymentDeduction', t('Payment Deduction'))
    ]
  },

  {
    path: '/user', name: 'UserManage', component: Layout,
    meta: { title: t('User Management'), icon: 'el-icon-user', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('User', t('User')),
      ...r('Profile', t('Profile')),
      ...r('WechatUser', t('Wechat User'))
    ]
  },

  {
    path: '/system-option', name: 'SystemOptionManage', component: Layout,
    meta: { title: t('System Options'), icon: 'el-icon-setting', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Category', t('Category')),
      ...r('Tag', t('Tag')),
      ...r('Setting', t('Setting'))
    ]
  }
]
