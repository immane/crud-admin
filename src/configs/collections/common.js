import axios from '@/utils/request'

export default {
  Album: {
    list: {
      list_display: [
        'id',
        'title',
        'type',
        'comment'
      ]
    },
    form: {
      fields: '__all__'
    }
  },

  Picture: {
    list: {
      list_display: [
        'id',
        { property: 'image', type: 'image' },
        { property: 'album',
          component: {
            props: ['data'],
            render(h) {
              return <p> {
                this.data.map(item => {
                  return <el-tag>{item.__toString}</el-tag>
                })
              } </p>
            }
          }
        },
        'title',
        'type'
      ]
    },
    form: {
      fields: [
        'album',
        'title',
        'type',
        { property: 'image', type: 'image' },
        'comment'
      ]
    }
  },

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
        { property: 'cover', type: 'image' },
        'category',
        'title',
        'createdTime'
      ]
    }
  },

  Category: {
    form: {
      fields: [
        'name',
        'type',
        { property: 'parent', required: false },
        { property: 'enabled', required: false, default_value: true },
        { property: 'sequence', required: false, default_value: 0 },
        { property: 'icon', required: false, type: 'image' }
      ]
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
        { property: 'enabled', type: 'boolean', default_value: true, field_options: { label: '是否启用？' }},
        { property: 'plainPassword', field_options: { label: '密码' }}
      ]
    },
    list: {
      list_display: [
        'id',
        { property: 'username', label: '用户名' },
        'phone',
        'token',
        { property: 'enabled', type: 'boolean', label: '是否启用' },
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
      list_display: [
        'id',
        { property: 'avatarUrl', type: 'image' },
        'nickname',
        'user',
        'region'
      ]
    }
  }
}
