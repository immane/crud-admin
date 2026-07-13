import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Picture: {
    form: {
      fields: [
        { property: 'user', required: false },
        { property: 'title', required: false },
        'category',
        { property: 'image', type: 'image', required: true },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: t('Title')
      },
      list_display: [
        'id',
        { property: 'image', type: 'image' },
        'title',
        'user',
        'category',
        'createdAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
