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
        title: 'Title',
        'category.id': () => axios
          .get(apiPath(API_PREFIX, 'manage/categories'))
          .then(res => Object.assign({ __label: 'Category' }, ...res.data.map(v => ({ [v.id]: v.name }))))
      },
      list_display: [
        'id',
        'title',
        'category',
        'tags',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'title',
        'category',
        'tags',
        'author',
        { property: 'body', type: 'text', full_width: true },
        'status',
        'publishedAt',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
