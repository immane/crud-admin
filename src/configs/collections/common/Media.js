import { orderByIdDesc } from '../helpers'

export default {
  Media: {
    form: {
      fields: [
        'filename',
        'originalFilename',
        'mimeType',
        'size',
        { property: 'path', type: 'image' },
        { property: 'alt', required: false },
        { property: 'title', required: false },
        { property: 'width', required: false },
        { property: 'height', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        filename: '文件名',
        mimeType: 'MIME 类型'
      },
      list_display: [
        'id',
        'filename',
        'originalFilename',
        'mimeType',
        'size',
        { property: 'path', type: 'image' },
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'filename',
        'originalFilename',
        'mimeType',
        'size',
        'width',
        'height',
        'alt',
        'title',
        { property: 'path', type: 'image', full_width: true },
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
