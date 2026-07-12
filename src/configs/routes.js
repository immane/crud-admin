import { r } from '@/router/generator'
import Layout from '@/layout'

export default [
  {
    path: '/product', name: 'ProductManage', component: Layout,
    meta: { title: '商品管理', icon: 'el-icon-goods', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Product', '商品')
    ]
  },

  {
    path: '/order', name: 'OrderManage', component: Layout,
    meta: { title: '订单管理', icon: 'el-icon-s-order', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Order', '订单'),
      ...r('Invoice', '发票'),
      ...r('OrderItem', '订单明细')
    ]
  },

  {
    path: '/promotion', name: 'PromotionManage', component: Layout,
    meta: { title: '促销管理', icon: 'el-icon-s-promotion', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Promotion', '促销活动'),
      ...r('PromotionTemplate', '促销模板')
    ]
  },

  {
    path: '/content', name: 'ContentManage', component: Layout,
    meta: { title: '内容管理', icon: 'el-icon-document', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', '内容'),
      ...r('Page', '页面'),
      ...r('Comment', '评论'),
      ...r('Media', '媒体')
    ]
  },

  {
    path: '/wallet', name: 'WalletManage', component: Layout,
    meta: { title: '钱包管理', icon: 'el-icon-money', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Wallet', '钱包'),
      ...r('WalletTransaction', '交易记录'),
      ...r('WalletPaymentDeduction', '支付扣款')
    ]
  },

  {
    path: '/user', name: 'UserManage', component: Layout,
    meta: { title: '用户管理', icon: 'el-icon-user', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('User', '用户'),
      ...r('Profile', '用户资料'),
      ...r('WechatUser', '微信用户')
    ]
  },

  {
    path: '/system-option', name: 'SystemOptionManage', component: Layout,
    meta: { title: '系统选项', icon: 'el-icon-setting', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Category', '分类'),
      ...r('Tag', '标签'),
      ...r('Setting', '配置')
    ]
  }
]
