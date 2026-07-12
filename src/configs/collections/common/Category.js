import axios from '@/utils/request'
import { API_PREFIX, apiPath } from '@/api/prefix'

export default {
  Category: {
    form: {
      fields: [
        'name',
        { property: 'slug', required: false },
        { property: 'description', type: 'text', required: false },
        { property: 'parent', required: false },
        { property: 'sortOrder', required: false, default_value: 0 },
        { property: 'enabled', type: 'boolean', required: false, default_value: true }
      ]
    },
    list: {
      query: { '@order': 'entity.sortOrder|ASC, entity.id|DESC' },
      list_filter: {
        name: '分类名称',
        enabled: {
          label: '启用',
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        },
        'parent.id': () => axios
          .get(apiPath(API_PREFIX, 'manage/categories'))
          .then(res => Object.assign({ __label: '上级分类' }, ...res.data.map(v => ({ [v.id]: v.name }))))
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
    },
    detail: {
      detail_display: [
        'id',
        'name',
        'slug',
        { property: 'description', type: 'text', full_width: true },
        'parent',
        'enabled',
        'sortOrder',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
