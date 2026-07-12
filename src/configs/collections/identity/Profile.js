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
            { value: 'bronze', label: t('Bronze') },
            { value: 'silver', label: t('Silver') },
            { value: 'gold', label: t('Gold') },
            { value: 'platinum', label: t('Platinum') },
            { value: 'diamond', label: t('Diamond') }
          ]
        }},
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        nickname: t('Nickname'),
        level: {
          __label: t('Level'),
          bronze: t('Bronze'),
          silver: t('Silver'),
          gold: t('Gold'),
          platinum: t('Platinum'),
          diamond: t('Diamond')
        }
      },
      list_display: ['id', 'user', 'nickname', 'level', 'joinedAt', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
