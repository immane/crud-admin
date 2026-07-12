import { orderByIdDesc } from '../helpers'

export default {
  Profile: {
    form: {
      fields: [
        { property: 'nickname', required: false },
        { property: 'avatar', type: 'image', required: false },
        { property: 'level', type: 'select', default_value: 'bronze', type_options: {
          options: [
            { value: 'bronze', label: '青铜' },
            { value: 'silver', label: '白银' },
            { value: 'gold', label: '黄金' },
            { value: 'platinum', label: '铂金' },
            { value: 'diamond', label: '钻石' }
          ]
        }},
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        nickname: '昵称',
        level: {
          __label: '等级',
          bronze: '青铜',
          silver: '白银',
          gold: '黄金',
          platinum: '铂金',
          diamond: '钻石'
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
    }
  }
}
