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
          __label: 'Type',
          deposit: 'Deposit',
          withdrawal: 'Withdrawal',
          transfer: 'Transfer',
          fee: 'Fee',
          refund: 'Refund'
        },
        status: {
          __label: 'Status',
          pending: 'Pending',
          completed: 'Completed',
          failed: 'Failed',
          reversed: 'Reversed'
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
