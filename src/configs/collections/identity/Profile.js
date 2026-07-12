import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Profile: {
    form: {
      fields: [
        { property: 'nickname', required: false },
        { property: 'avatar', type: 'image', required: false },
        { property: 'level', type: 'select', default_value: 'bronze', type_options: {
          options: [
            { value: 'bronze', label: t('entity.bronze') },
            { value: 'silver', label: t('entity.silver') },
            { value: 'gold', label: t('entity.gold') },
            { value: 'platinum', label: t('entity.platinum') },
            { value: 'diamond', label: t('entity.diamond') }
          ]
        }},
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        nickname: t('entity.nickname'),
        level: {
          __label: t('entity.level'),
          bronze: t('entity.bronze'),
          silver: t('entity.silver'),
          gold: t('entity.gold'),
          platinum: t('entity.platinum'),
          diamond: t('entity.diamond')
        }
      },
      list_display: ['id', 'user', 'nickname', 'level', 'joinedAt', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
