import { orderByIdDesc } from '../helpers'

export default {
  WalletTransaction: {
    entity: { name: 'WalletTransaction', plural: 'transactions' },
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'edit', 'delete'],
      list_filter: {
        type: {
          __label: '类型',
          deposit: '充值',
          withdrawal: '提现',
          transfer: '转账',
          fee: '手续费',
          refund: '退款'
        },
        status: {
          __label: '状态',
          pending: '待处理',
          completed: '已完成',
          failed: '失败',
          reversed: '已冲正'
        }
      },
      list_display: [
        'id',
        'uuid',
        'amount',
        'type',
        'status',
        'fromWallet',
        'toWallet',
        'referenceId',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'uuid',
        'amount',
        'currency',
        'type',
        'status',
        'fromWallet',
        'toWallet',
        'referenceId',
        'referenceType',
        'metadata',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
