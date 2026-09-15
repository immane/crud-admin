import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

const uploadMocks = vi.hoisted(() => ({
  getUploadUrl: vi.fn(() => 'https://api.test/api/v1/manage/media/upload'),
  getUploadData: vi.fn((storage) => ({ storage: storage || 'local' })),
  getUploadHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
  resolveUploadPath: vi.fn((response) => {
    const data = response?.data
    if (!data) return null
    const path = typeof data === 'string' ? data : data.path
    return path ? `https://cdn.test/${path}` : null
  })
}))

vi.mock('@/utils/upload', () => ({
  __esModule: true,
  getUploadUrl: (...args) => uploadMocks.getUploadUrl(...args),
  getUploadData: (...args) => uploadMocks.getUploadData(...args),
  getUploadHeaders: (...args) => uploadMocks.getUploadHeaders(...args),
  resolveUploadPath: (...args) => uploadMocks.resolveUploadPath(...args)
}))

const sipMocks = vi.hoisted(() => ({
  getPicture: vi.fn((url) => `pic:${url}`)
}))

vi.mock('@/utils/simple-image-process', () => ({
  __esModule: true,
  default: { getPicture: (...args) => sipMocks.getPicture(...args) }
}))

import ImagePlugin from '@/components/EasyAdmin/plugins/form/image.vue'

const UploadStub = {
  name: 'ElUpload',
  props: ['action', 'data', 'headers', 'limit', 'accept', 'fileList', 'listType', 'onRemove', 'onSuccess', 'onExceed', 'onError'],
  template: '<div class="upload-stub"><slot /><slot name="tip" /></div>',
  methods: {
    clearFiles() {},
    handleStart() {},
    submit() {}
  }
}
const ButtonStub = { name: 'ElButton', template: '<button><slot /></button>' }

function makeWrapper(form, field) {
  return mount(ImagePlugin, {
    props: { form, field },
    global: {
      mocks: { $t: (k) => k, $message: { error: vi.fn() } },
      stubs: { 'el-upload': UploadStub, 'el-button': ButtonStub }
    }
  })
}

function upload(wrapper) {
  return wrapper.findComponent(UploadStub)
}

describe('form-image plugin', () => {
  beforeEach(() => {
    Object.values(uploadMocks).forEach((fn) => fn.mockClear())
    sipMocks.getPicture.mockClear()
    uploadMocks.getUploadUrl.mockReturnValue('https://api.test/api/v1/manage/media/upload')
    uploadMocks.getUploadData.mockImplementation((storage) => ({ storage: storage || 'local' }))
    uploadMocks.getUploadHeaders.mockReturnValue({ Authorization: 'Bearer test-token' })
    uploadMocks.resolveUploadPath.mockImplementation((response) => {
      const data = response?.data
      if (!data) return null
      const path = typeof data === 'string' ? data : data.path
      return path ? `https://cdn.test/${path}` : null
    })
    sipMocks.getPicture.mockImplementation((url) => `pic:${url}`)
  })

  it('computes upload action/data/headers and merges custom storage/data/headers', () => {
    const form = reactive({ cover: '' })
    const field = reactive({
      property: 'cover', type: 'image',
      type_options: { storage: 's3', data: { foo: 'bar' }, headers: { 'X-Custom': '1' } }
    })
    const wrapper = makeWrapper(form, field)
    const u = upload(wrapper)
    expect(uploadMocks.getUploadUrl).toHaveBeenCalled()
    expect(uploadMocks.getUploadData).toHaveBeenCalledWith('s3')
    expect(uploadMocks.getUploadHeaders).toHaveBeenCalled()
    expect(u.props('action')).toBe('https://api.test/api/v1/manage/media/upload')
    expect(u.props('data')).toEqual({ storage: 's3', foo: 'bar' })
    expect(u.props('headers')).toEqual({ Authorization: 'Bearer test-token', 'X-Custom': '1' })
    wrapper.unmount()
  })

  it('maps single image value to picture file-list with default accept and limit 1', () => {
    const form = reactive({ cover: 'a.jpg' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    const u = upload(wrapper)
    expect(sipMocks.getPicture).toHaveBeenCalledWith('a.jpg')
    expect(u.props('fileList')).toEqual([{ name: 'a.jpg', url: 'pic:a.jpg' }])
    expect(u.props('accept')).toBe('image/*')
    expect(u.props('limit')).toBe(1)
    expect(u.props('listType')).toBe('picture')
    wrapper.unmount()
  })

  it('maps images array value to file-list and leaves limit undefined', () => {
    const form = reactive({ photos: ['a.jpg', 'b.jpg'] })
    const field = reactive({ property: 'photos', type: 'images' })
    const wrapper = makeWrapper(form, field)
    const u = upload(wrapper)
    expect(u.props('fileList')).toEqual([
      { name: 'a.jpg', url: 'pic:a.jpg' },
      { name: 'b.jpg', url: 'pic:b.jpg' }
    ])
    expect(u.props('limit')).toBeUndefined()
    wrapper.unmount()
  })

  it('renders empty file-list when form value is empty', () => {
    const form = reactive({ cover: '' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    expect(upload(wrapper).props('fileList')).toEqual([])
    wrapper.unmount()
  })

  it('honours custom accept from type_options', () => {
    const form = reactive({ cover: '' })
    const field = reactive({ property: 'cover', type: 'image', type_options: { accept: '.png' } })
    const wrapper = makeWrapper(form, field)
    expect(upload(wrapper).props('accept')).toBe('.png')
    wrapper.unmount()
  })

  it('handleSuccess sets single image path via el-upload on-success event', async () => {
    const form = reactive({ cover: '' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onSuccess')({ data: { path: 'new.jpg' } })
    expect(uploadMocks.resolveUploadPath).toHaveBeenCalled()
    expect(form.cover).toBe('https://cdn.test/new.jpg')
    wrapper.unmount()
  })

  it('handleSuccess appends to images array and initialises non-array', async () => {
    const form = reactive({ photos: ['old.jpg'] })
    const field = reactive({ property: 'photos', type: 'images' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onSuccess')({ data: { path: 'new.jpg' } })
    expect(form.photos).toEqual(['old.jpg', 'https://cdn.test/new.jpg'])

    const form2 = reactive({ photos: '' })
    const wrapper2 = makeWrapper(form2, field)
    await upload(wrapper2).props('onSuccess')({ data: 'solo.jpg' })
    expect(form2.photos).toEqual(['https://cdn.test/solo.jpg'])
    wrapper.unmount()
    wrapper2.unmount()
  })

  it('handleSuccess ignores responses with no resolvable path', async () => {
    const form = reactive({ cover: 'keep.jpg' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onSuccess')({ data: null })
    expect(form.cover).toBe('keep.jpg')
    wrapper.unmount()
  })

  it('handleError surfaces message via $message.error on el-upload on-error event', async () => {
    const form = reactive({ cover: '' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    const message = wrapper.vm.$message
    await upload(wrapper).props('onError')(new Error('boom'))
    expect(message.error).toHaveBeenCalledWith('boom')
    await upload(wrapper).props('onError')({})
    expect(message.error).toHaveBeenCalledWith('Upload failed')
    wrapper.unmount()
  })

  it('handleExceed resets value and restarts upload via $refs on el-upload on-exceed event', async () => {
    const form = reactive({ cover: 'old.jpg' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    const uploadVm = upload(wrapper).vm
    uploadVm.clearFiles = vi.fn()
    uploadVm.handleStart = vi.fn()
    uploadVm.submit = vi.fn()
    const files = [{ name: 'big.jpg' }]
    await upload(wrapper).props('onExceed')(files)
    expect(form.cover).toBe('')
    await nextTick()
    await nextTick()
    expect(uploadVm.clearFiles).toHaveBeenCalledTimes(1)
    expect(uploadVm.handleStart).toHaveBeenCalledWith(files[0])
    expect(uploadVm.submit).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('on-remove clears single image and maps images fileList names', async () => {
    const form = reactive({ cover: 'a.jpg' })
    const field = reactive({ property: 'cover', type: 'image' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onRemove')({ name: 'a.jpg' }, [])
    expect(form.cover).toBe('')

    const form2 = reactive({ photos: ['a.jpg', 'b.jpg'] })
    const field2 = reactive({ property: 'photos', type: 'images' })
    const wrapper2 = makeWrapper(form2, field2)
    await upload(wrapper2).props('onRemove')({ name: 'a.jpg' }, [{ name: 'b.jpg' }])
    expect(form2.photos).toEqual(['b.jpg'])
    wrapper.unmount()
    wrapper2.unmount()
  })

  it('validates parent form field after success when ancestor exposes validateField', async () => {
    const validateField = vi.fn()
    const form = reactive({ cover: '' })
    const field = reactive({ property: 'cover', type: 'image' })
    const ParentHarness = {
      components: { ChildPlugin: ImagePlugin },
      data: () => ({ form, field }),
      template: '<div><ChildPlugin :form="form" :field="field" /><div ref="form"></div></div>',
      mounted() { this.$refs.form.validateField = validateField }
    }
    const parent = mount(ParentHarness, {
      global: {
        mocks: { $t: (k) => k, $message: { error: vi.fn() } },
        stubs: { 'el-upload': UploadStub, 'el-button': ButtonStub }
      }
    })
    const childUpload = parent.findComponent(UploadStub)
    await childUpload.props('onSuccess')({ data: { path: 'v.jpg' } })
    await nextTick()
    await nextTick()
    expect(form.cover).toBe('https://cdn.test/v.jpg')
    expect(validateField).toHaveBeenCalledWith('cover')
    parent.unmount()
  })
})
