import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Picture: {
    form: {
      fields: [
        { property: 'user', required: false },
        { property: 'title', required: false },
        'category',
        { property: 'image', type: 'image', required: true, help: t('Picture image help') },
        { property: 'metadata', type: 'json', required: false, help: t('Picture metadata help') }
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
      detail_display: [
        'id',
        'title',
        'user',
        'category',
        'createdAt',
        'updatedAt',
        { property: 'image', type: 'image', full_width: true }
      ]
    }
  }
}
