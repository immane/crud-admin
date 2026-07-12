import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Media: {
    form: {
      fields: [
        'filename', 'originalFilename', 'mimeType', 'size',
        { property: 'path', type: 'image' },
        { property: 'alt', required: false },
        { property: 'title', required: false },
        { property: 'width', required: false },
        { property: 'height', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        filename: t('entity.filename'),
        mimeType: t('entity.mimeType')
      },
      list_display: ['id', 'filename', 'originalFilename', 'mimeType', 'size', { property: 'path', type: 'image' }, 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
