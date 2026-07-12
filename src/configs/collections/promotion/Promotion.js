import { orderByIdDesc } from '../helpers'

export default {
  Promotion: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        { property: 'storeCode', required: false },
        { property: 'enabled', type: 'boolean', required: false, default_value: false },
        { property: 'startTime', required: false },
        { property: 'endTime', required: false },
        { property: 'config', type: 'json', required: false },
        { property: 'conflictMode', type: 'select', default_value: 'stackable', type_options: {
          options: [
            { value: 'stackable', label: '可叠加' },
            { value: 'exclusive', label: '互斥' },
            { value: 'priority', label: '按优先级' }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: '活动名称',
        storeCode: '门店编码',
        enabled: {
          label: '启用',
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        }
      },
      list_display: [
        'id',
        'name',
        'enabled',
        'startTime',
        'endTime',
        'conflictMode',
        'template',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'name',
        'enabled',
        { property: 'description', type: 'text', full_width: true },
        'storeCode',
        'startTime',
        'endTime',
        'conflictMode',
        'template',
        { property: 'config', type: 'json', full_width: true },
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
