import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Media: {
    list: {
      disabled_actions: ['new', 'edit'],
      query: orderByIdDesc,
      list_filter: {
        filename: t('Filename'),
        mimeType: t('MIME Type')
      },
      list_display: ['id', 'filename', 'originalFilename', 'mimeType', 'size', { property: 'path', type: 'image' }, 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
