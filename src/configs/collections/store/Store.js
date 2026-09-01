import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Store: {
    entity: { name: 'Store', plural: 'stores' },
    form: {
      fields: [
        'code',
        'name',
        {
          property: 'status',
          type: 'select',
          default_value: 'activate',
          help: t('Store status help'),
          type_options: {
            options: [
              { value: 'activate', label: t('Activate') },
              { value: 'suspend', label: t('Suspend') },
              { value: 'close', label: t('Close') }
            ]
          }
        },
        'timezone',
        { property: 'contact', type: 'json', required: false, help: t('Store contact help') },
        { property: 'address', type: 'json', required: false, help: t('Store address help') },
        { property: 'settings', type: 'json', required: false, help: t('Store settings help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['delete'],
      list_filter: {
        code: t('Code'),
        name: t('Name'),
        status: {
          __label: t('Status'),
          activate: t('Activate'),
          suspend: t('Suspend'),
          close: t('Close')
        }
      },
      list_display: [
        'id',
        'code',
        'name',
        'status',
        'timezone',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
