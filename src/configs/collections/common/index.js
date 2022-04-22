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
      fields: [
        'title',
        'type',
        { property: 'pictures', type: 'images' },
        'comment'
      ]
    }
  },

  Picture: {
    list: {
      list_display: [
        'id',
        { property: 'image', type: 'image' },
        {
          property: 'album',
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

  Balance: {
    form: {
      fields: ['user', 'amount']
    },
    list: {
      list_filter: {
        usernameOrNickname: {
          expression: 'entity.getUser().__toString() matches "/:value/"',
          label: '用户名 / 昵称',
          type: 'input'
        }
      },
      list_display: [
        'id', 'user', 'amount'
      ]
    }
  },

  BalanceLog: {
    form: {
      fields: '__all__'
    },
    list: {
      query: {
        '@order': 'createdTime|DESC'
      },
      disabled_actions: ['new', 'edit', 'delete', 'lines'],
      list_display: [
        'id',
        'source',
        {
          property: 'user',
          label: '收款人'
        },
        'type',
        'before',
        {
          property: 'amount',
          component: {
            props: ['data'],
            render(h) {
              return (
                <span>{this.data >= 0 ? '+' : ''}{this.data}</span>
              )
            }
          }
        },
        'after',
        'comment',
        'createdTime'
      ]
    }
  },

  Content: {
    form: {
      fields: [
        'title',
        {
          property: 'category',
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
              Object.assign({ __label: '分类' },
                ...res.data.map(v => { return { [v.id]: v.name } })))
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
      list_display: ['id', 'type', 'name', 'parent', 'enabled', 'sequence'],
      list_filter: {
        'type.id': () => {
          return axios
            .get('/manage/types')
            .then(res =>
              Object.assign({ __label: '类型' },
                ...res.data.map(v => { return { [v.id]: v.name } })
              )
            )
        },
        'parent.id': () => {
          return axios
            .get('/manage/categories')
            .then(res =>
              Object.assign({ __label: '上级分类' },
                ...res.data.map(v => { return { [v.id]: v.name } })
              )
            )
        }
      }
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
      disabled_actions: ['new', 'delete', 'edit', 'lines'],
      list_display: [
        'id',
        { property: 'avatarUrl', type: 'image' },
        'nickname',
        'user',
        {
          property: 'amount',
          label: '余额',
          component: {
            props: ['scope'],
            data() {
              return { amount: 0 }
            },
            created() {
              axios.get(
                `/manage/users/${this.scope.row.user.id}`,
                { params: { '@expands': "['entity.balance']" }}
              ).then((res) => {
                console.log(res)
                if (res.data.balance != null) {
                  this.amount = res.data.balance.__metadata.amount
                }
              })
            },
            render(h) {
              return (
                <el-tag>{this.amount}</el-tag>
              )
            }
          }
        }
      ]
    }
  }
}
