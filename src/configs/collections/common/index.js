import axios from '@/utils/request'
import { API_PREFIX, apiPath } from '@/api/prefix'

const statusFilter = {
  status: {
    __label: '状态',
    active: '启用',
    inactive: '停用'
  }
}

const orderByIdDesc = {
  '@order': 'entity.id|DESC'
}

export default {
  Product: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' }
          ]
        }},
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: '商品名称',
        ...statusFilter
      },
      list_display: [
        'id',
        'name',
        'status',
        'isDeleted',
        'createdAt',
        'updatedAt'
      ]
    }
  },

  Order: {
    form: {
      fields: [
        { property: 'notes', type: 'text', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: '状态',
          draft: '草稿',
          pending: '待处理',
          confirmed: '已确认',
          paid: '已支付',
          fulfilled: '已发货',
          completed: '已完成',
          cancelled: '已取消',
          refunded: '已退款'
        }
      },
      list_display: [
        'id',
        'uuid',
        'user',
        'totalAmount',
        'currency',
        'status',
        'paymentMethod',
        'paidAt',
        'createdAt'
      ]
    }
  },

  Invoice: {
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'delete'],
      list_display: [
        'id',
        'user',
        'amount',
        'currency',
        'status',
        'createdAt',
        'updatedAt'
      ]
    }
  },

  Content: {
    form: {
      fields: [
        'title',
        { property: 'body' },
        { property: 'category', required: false },
        { property: 'tags', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: '标题',
        'category.id': () => {
          return axios
            .get(apiPath(API_PREFIX, 'manage/categories'))
            .then(res => Object.assign({ __label: '分类' }, ...res.data.map(v => ({ [v.id]: v.name }))))
        }
      },
      list_display: [
        'id',
        'title',
        'category',
        'tags',
        'createdAt',
        'updatedAt'
      ]
    }
  },

  Page: {
    form: {
      fields: [
        'title',
        'slug',
        { property: 'body', type: 'text' },
        { property: 'metaTitle', required: false },
        { property: 'metaDescription', type: 'text', required: false },
        { property: 'status', type: 'select', default_value: 'draft', type_options: {
          options: [
            { value: 'draft', label: '草稿' },
            { value: 'published', label: '已发布' }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: '标题',
        status: {
          __label: '状态',
          draft: '草稿',
          published: '已发布'
        }
      },
      list_display: [
        'id',
        'title',
        'slug',
        'status',
        'publishedAt',
        'createdAt'
      ]
    }
  },

  Comment: {
    form: {
      fields: [
        { property: 'body', type: 'text' },
        'entityType',
        'entityId',
        { property: 'status', type: 'select', default_value: 'pending', type_options: {
          options: [
            { value: 'pending', label: '待审核' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已拒绝' }
          ]
        }},
        { property: 'parent', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        body: '评论内容',
        status: {
          __label: '状态',
          pending: '待审核',
          approved: '已通过',
          rejected: '已拒绝'
        }
      },
      list_display: [
        'id',
        'body',
        'entityType',
        'entityId',
        'status',
        'author',
        'createdAt'
      ]
    }
  },

  Media: {
    form: {
      fields: [
        'filename',
        'originalFilename',
        'mimeType',
        'size',
        'path',
        { property: 'alt', required: false },
        { property: 'title', required: false },
        { property: 'width', required: false },
        { property: 'height', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        filename: '文件名',
        mimeType: 'MIME 类型'
      },
      list_display: [
        'id',
        'filename',
        'originalFilename',
        'mimeType',
        'size',
        'path',
        'createdAt'
      ]
    }
  },

  Wallet: {
    form: {
      fields: [
        'user',
        { property: 'currency', default_value: 'CNY' },
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: '启用' },
            { value: 'frozen', label: '冻结' }
          ]
        }},
        { property: 'label', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: '状态',
          active: '启用',
          frozen: '冻结'
        }
      },
      list_display: [
        'id',
        'user',
        'currency',
        'balance',
        'status',
        'version',
        'label'
      ]
    }
  },

  WalletTransaction: {
    entity: { name: 'WalletTransaction', plural: 'transactions' },
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'edit', 'delete'],
      list_filter: {
        type: {
          __label: '类型',
          deposit: '充值',
          withdrawal: '提现',
          transfer: '转账',
          fee: '手续费',
          refund: '退款'
        },
        status: {
          __label: '状态',
          pending: '待处理',
          completed: '已完成',
          failed: '失败',
          reversed: '已冲正'
        }
      },
      list_display: [
        'id',
        'uuid',
        'amount',
        'type',
        'status',
        'fromWallet',
        'toWallet',
        'referenceId',
        'createdAt'
      ]
    }
  },

  User: {
    form: {
      fields: [
        { property: 'username', field_options: { label: '用户名' }},
        { property: 'email', field_options: { label: 'Email' }},
        { property: 'phone', required: false },
        { property: 'phoneVerified', type: 'boolean', required: false },
        { property: 'roles', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        username: '用户名',
        email: 'Email',
        phone: '手机号'
      },
      list_display: [
        'id',
        'username',
        'email',
        'phone',
        'phoneVerified',
        'roles'
      ]
    }
  },

  WechatUser: {
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      list_display: [
        'id',
        'user',
        'openid',
        'unionid',
        'nickname',
        'createdAt'
      ]
    }
  },

  Category: {
    form: {
      fields: [
        'name',
        { property: 'slug', required: false },
        { property: 'description', type: 'text', required: false },
        { property: 'parent', required: false },
        { property: 'sortOrder', required: false, default_value: 1 },
        { property: 'enabled', type: 'boolean', required: false, default_value: true }
      ]
    },
    list: {
      query: {
        '@order': 'entity.sortOrder|ASC, entity.id|DESC'
      },
      list_filter: {
        name: '分类名称',
        enabled: {
          label: '启用',
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        },
        'parent.id': () => {
          return axios
            .get(apiPath(API_PREFIX, 'manage/categories'))
            .then(res => Object.assign({ __label: '上级分类' }, ...res.data.map(v => ({ [v.id]: v.name }))))
        }
      },
      list_display: [
        'id',
        'name',
        'slug',
        'parent',
        'enabled',
        'sortOrder',
        'createdAt'
      ]
    }
  },

  Tag: {
    form: {
      fields: [
        'name',
        { property: 'slug', required: false },
        { property: 'color', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: '标签名称',
        slug: 'Slug'
      },
      list_display: [
        'id',
        'name',
        'slug',
        'color',
        'createdAt'
      ]
    }
  },

  Setting: {
    form: {
      fields: [
        { property: 'key', field_options: { label: '键名' }},
        'value',
        'type',
        'groupName',
        { property: 'label', required: false },
        { property: 'description', type: 'text', required: false },
        { property: 'sortOrder', required: false, default_value: 1 }
      ]
    },
    list: {
      query: {
        '@order': 'entity.groupName|ASC, entity.sortOrder|ASC, entity.id|DESC'
      },
      list_filter: {
        key: '键名',
        groupName: '分组'
      },
      list_display: [
        'id',
        'key',
        'value',
        'type',
        'groupName',
        'label',
        'sortOrder'
      ]
    }
  }
}
