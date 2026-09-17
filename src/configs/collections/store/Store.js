import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'
import StoreAddressSchema from './StoreAddress.json'
import StoreContactSchema from './StoreContact.json'

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
        { property: 'contact', type: 'json_schema', required: false, type_options: { schema: StoreContactSchema }, help: t('Store contact help') },
        { property: 'address', type: 'json_schema', required: false, type_options: { schema: StoreAddressSchema }, help: t('Store address help') },
        { property: 'settings', type: 'json', required: false, help: t('Store settings help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['delete'],
      list_filter: {
        code: t('Code'),
        name: t('Name'),
        timezone: t('Timezone'),
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
      detail_display: [
        { property: 'contact', type: 'json_schema', type_options: { schema: StoreContactSchema }, full_width: true },
        { property: 'address', type: 'json_schema', type_options: { schema: StoreAddressSchema }, full_width: true },
        '__all__'
      ]
    }
  }
}
