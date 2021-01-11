import { g, r } from '@/router/generator'
import Layout from '@/layout'

export default {
  /**
   * Custom Menu
   *
   * Change current section and define your menu and relations here.
   */
  routes: [
    // Content manage
    {
      path: '/content', name: 'ContentManage', component: Layout,
      meta: { title: '内容管理', icon: 'el-icon-document', roles: ['ROLE_SUPER_ADMIN'] },
      children: [
        ...g('Content', '内容')
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
        ...r('Option', '配置')
      ]
    }
  ],

  /**
   * Entities config
   */
  entities: {
    Content: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'category', 'title', 'createdTime']
      }
    },
    Category: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'type', 'name', 'parent', 'enabled', 'sequence']
      }
    },
    Option: {
      form: {
        fields: [
          { property: 'name', type_options: { disabled: true }},
          'value'
        ]
      },
      list: {
        disabled_actions: ['new', 'delete'],
        list_display: ['id', 'name', 'value', 'readable']
      }
    },
    Type: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'name', 'slug']
      }
    },
    User: {
      form: {
        fields: '__all__'
      },
      list: {
        list_display: ['id', 'username', 'phone', 'createdTime']
      }
    },
    UserProfile: {
      form: {
        fields: '__all__'
      },
      list: {
        disabled_actions: ['new', 'delete'],
        list_display: ['id', 'nickname', 'user', { property: 'user.__metadata.phone', label: '电话' }, 'avatarUrl']
      }
    }
  }
}
