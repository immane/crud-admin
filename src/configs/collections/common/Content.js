import axios from '@/utils/request'
import { API_PREFIX, apiPath } from '@/api/prefix'
import { orderByIdDesc } from '../helpers'

export default {
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
        'category.id': () => axios
          .get(apiPath(API_PREFIX, 'manage/categories'))
          .then(res => Object.assign({ __label: '分类' }, ...res.data.map(v => ({ [v.id]: v.name }))))
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
  }
}
