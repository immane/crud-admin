import { orderByIdDesc } from '../helpers'

export default {
  WalletPaymentDeduction: {
    entity: { name: 'WalletPaymentDeduction', plural: 'payment-deductions' },
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'edit', 'delete'],
      list_filter: {
        type: {
          __label: '类型',
          deduction: '扣款',
          reversal: '冲正',
          release: '释放',
          refund: '退款'
        },
        status: {
          __label: '状态',
          pending: '待处理',
          applied: '已生效',
          released: '已释放',
          refunded: '已退款',
          reversed: '已冲正'
        }
      },
      list_display: [
        'id',
        'invoiceNo',
        'amount',
        'type',
        'status',
        'wallet',
        'referenceId',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'invoiceNo',
        'amount',
        'currency',
        'type',
        'status',
        'wallet',
        'referenceId',
        'referenceType',
        'metadata',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
