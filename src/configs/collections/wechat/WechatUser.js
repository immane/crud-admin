import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  WechatUser: {
    form: {
      fields: [
        { property: 'openid', help: t('WechatUser openid help') },
        { property: 'unionid', help: t('WechatUser unionid help') },
        { property: 'appType', help: t('WechatUser appType help') },
        '__all__'
      ]
    },
    list: {
      query: orderByIdDesc,
      list_display: [
        'id',
        'user',
        'openid',
        'unionid',
        'nickname',
        'appType',
        'lastLoginAt',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'user',
        'nickname',
        'openid',
        'unionid',
        'appType',
        'avatarUrl',
        'country',
        'province',
        'city',
        'lastLoginAt',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
