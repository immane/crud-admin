import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Page: {
    form: {
      fields: [
        'title', { property: 'slug', help: t('Page slug help') },
        { property: 'body', type: 'text' },
        { property: 'metaTitle', required: false, help: t('Page metaTitle help') },
        { property: 'metaDescription', type: 'text', required: false, help: t('Page metaDescription help') },
        { property: 'status', type: 'select', default_value: 'draft', help: t('Page status help'), type_options: {
          options: [
            { value: 'draft', label: t('Draft') },
            { value: 'published', label: t('Published') }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: t('Title'),
        status: {
          __label: t('Status'),
          draft: t('Draft'),
          published: t('Published')
        }
      },
      list_display: ['id', 'title', 'slug', 'status', 'publishedAt', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
