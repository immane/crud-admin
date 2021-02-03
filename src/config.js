import { g, r } from '@/router/generator'
import Layout from '@/layout'
import axios from '@/utils/request'

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
        fields: [
          'title',
          { property: 'category',
            relation_filter: {
              '@filter': 'entity.getType().getSlug() == "content"',
              '@order': 'id|ASC'
            }
          },
          { property: 'cover', type: 'image' },
          'enabled',
          'content'
        ]
      },
      list: {
        query: {
          '@order': 'id|DESC'
        },
        list_filter: {
          'category.id': () => {
            return axios
              .get('/api/categories',
                { params: { '@filter': 'entity.getType().getSlug() == "content"' }})
              .then(res =>
                Object.assign({}, ...res.data.map(v => { return { [v.id]: v.name } })))
          }
        },
        list_display: [
          'id',
          { property: 'cover',
            component: {
              props: ['data'],
              data() {
                return {
                  BASE_URL: process.env.VUE_APP_BASE_API
                }
              },
              render(h) {
                return (
                  <el-image
                    style='width: 50px; height: 50px; border: 3px white solid; box-shadow: 1px 1px 5px #ddd;'
                    src={`${this.BASE_URL}/uploads/images/${this.data}`}
                    preview-src-list={[`${this.BASE_URL}/uploads/images/${this.data}`]}
                  />
                )
              }
            }
          },
          'category',
          'title',
          'createdTime'
        ]
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
        fields: [
          { property: 'username', field_options: { label: '用户名' }},
          'phone',
          { property: 'email', field_options: { label: 'Email' }},
          { property: 'enabled', type: 'boolean', field_options: { label: '启用' }},
          { property: 'plainPassword', field_options: { label: '密码' }}
        ]
      },
      list: {
        list_display: [
          'id',
          'username',
          'phone',
          { property: 'enabled', type: 'boolean' },
          'createdTime'
        ]
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
