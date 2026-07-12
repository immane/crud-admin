import { orderByIdDesc } from '../helpers'

export default {
  WechatUser: {
    form: {
      fields: '__all__'
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
