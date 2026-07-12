import { orderByIdDesc } from '../helpers'

export default {
  Profile: {
    form: {
      fields: [
        { property: 'nickname', required: false },
        { property: 'avatar', type: 'image', required: false },
        { property: 'level', type: 'select', default_value: 'bronze', type_options: {
          options: [
            { value: 'bronze', label: 'Bronze' },
            { value: 'silver', label: 'Silver' },
            { value: 'gold', label: 'Gold' },
            { value: 'platinum', label: 'Platinum' },
            { value: 'diamond', label: 'Diamond' }
          ]
        }},
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        nickname: 'Nickname',
        level: {
          __label: 'Level',
          bronze: 'Bronze',
          silver: 'Silver',
          gold: 'Gold',
          platinum: 'Platinum',
          diamond: 'Diamond'
        }
      },
      list_display: [
        'id',
        'user',
        'nickname',
        'level',
        'joinedAt',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'user',
        'nickname',
        { property: 'avatar', type: 'image', full_width: true },
        'level',
        { property: 'metadata', type: 'json', full_width: true },
        'joinedAt',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
