import { r } from '@/router/generator'
import { t } from '@/i18n'
import Layout from '@/layout'

export default [
  {
    path: '/product', name: 'ProductManage', component: Layout,
    meta: { title: t('route.productManagement'), icon: 'el-icon-goods', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Product', t('route.product'))
    ]
  },

  {
    path: '/order', name: 'OrderManage', component: Layout,
    meta: { title: t('route.orderManagement'), icon: 'el-icon-tickets', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Order', t('route.order')),
      ...r('Invoice', t('route.invoice')),
      ...r('OrderItem', t('route.orderItem'))
    ]
  },

  {
    path: '/promotion', name: 'PromotionManage', component: Layout,
    meta: { title: t('route.promotionManagement'), icon: 'el-icon-s-promotion', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Promotion', t('route.promotion')),
      ...r('PromotionTemplate', t('route.promotionTemplate'))
    ]
  },

  {
    path: '/content', name: 'ContentManage', component: Layout,
    meta: { title: t('route.contentManagement'), icon: 'el-icon-notebook', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', t('route.content')),
      ...r('Page', t('route.page')),
      ...r('Comment', t('route.comment')),
      ...r('Media', t('route.media'))
    ]
  },

  {
    path: '/wallet', name: 'WalletManage', component: Layout,
    meta: { title: t('route.walletManagement'), icon: 'el-icon-wallet', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Wallet', t('route.wallet')),
      ...r('WalletTransaction', t('route.transaction')),
      ...r('WalletPaymentDeduction', t('route.paymentDeduction'))
    ]
  },

  {
    path: '/user', name: 'UserManage', component: Layout,
    meta: { title: t('route.userManagement'), icon: 'el-icon-user', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('User', t('route.user')),
      ...r('Profile', t('route.profile')),
      ...r('WechatUser', t('route.wechatUser'))
    ]
  },

  {
    path: '/system-option', name: 'SystemOptionManage', component: Layout,
    meta: { title: t('route.systemOptions'), icon: 'el-icon-setting', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Category', t('route.category')),
      ...r('Tag', t('route.tag')),
      ...r('Setting', t('route.setting'))
    ]
  }
]
