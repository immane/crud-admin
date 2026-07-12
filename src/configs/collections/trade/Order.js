import { orderByIdDesc } from '../helpers'

export default {
  Order: {
    form: {
      fields: [
        { property: 'notes', type: 'text', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: '状态',
          draft: '草稿',
          pending: '待处理',
          confirmed: '已确认',
          paid: '已支付',
          fulfilled: '已发货',
          completed: '已完成',
          cancelled: '已取消',
          refunded: '已退款'
        }
      },
      list_display: [
        'id',
        'uuid',
        'user',
        'totalAmount',
        'currency',
        'status',
        'paymentMethod',
        'paidAt',
        'createdAt'
      ]
    }
  }
}
