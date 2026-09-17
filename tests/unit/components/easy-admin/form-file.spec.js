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

import FilePlugin from '@/easyadmin/ui/vue/plugins/form/file.vue'

const UploadStub = {
  name: 'ElUpload',
  props: ['action', 'data', 'headers', 'limit', 'fileList', 'listType', 'onRemove', 'onSuccess', 'onExceed', 'onError'],
  template: '<div class="upload-stub"><slot /><slot name="tip" /></div>',
  methods: {
    clearFiles() {},
    handleStart() {},
    submit() {}
  }
}
const ButtonStub = { name: 'ElButton', template: '<button><slot /></button>' }

function makeWrapper(form, field) {
  return mount(FilePlugin, {
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

describe('form-file plugin', () => {
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

  it('computes upload action/data/headers and enforces single-file list type', () => {
    const form = reactive({ attachment: 'doc.pdf' })
    const field = reactive({
      property: 'attachment', type: 'file',
      type_options: { storage: 's3', data: { foo: 'bar' }, headers: { 'X-Custom': '1' } }
    })
    const wrapper = makeWrapper(form, field)
    const u = upload(wrapper)
    expect(uploadMocks.getUploadUrl).toHaveBeenCalled()
    expect(uploadMocks.getUploadData).toHaveBeenCalledWith('s3')
    expect(u.props('action')).toBe('https://api.test/api/v1/manage/media/upload')
    expect(u.props('data')).toEqual({ storage: 's3', foo: 'bar' })
    expect(u.props('headers')).toEqual({ Authorization: 'Bearer test-token', 'X-Custom': '1' })
    expect(u.props('limit')).toBe(1)
    expect(u.props('listType')).toBe('file')
    expect(u.props('fileList')).toEqual([{ name: 'doc.pdf', url: 'pic:doc.pdf' }])
    wrapper.unmount()
  })

  it('renders empty file-list when form value is empty', () => {
    const form = reactive({ attachment: '' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    expect(upload(wrapper).props('fileList')).toEqual([])
    wrapper.unmount()
  })

  it('handleSuccess writes resolved path via el-upload on-success event', async () => {
    const form = reactive({ attachment: '' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onSuccess')({ data: { path: 'report.pdf' } })
    expect(form.attachment).toBe('https://cdn.test/report.pdf')
    wrapper.unmount()
  })

  it('handleSuccess falls back to empty string when path is unresolvable', async () => {
    const form = reactive({ attachment: 'old.pdf' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onSuccess')({ data: null })
    expect(form.attachment).toBe('')
    wrapper.unmount()
  })

  it('handleError surfaces message via $message.error on el-upload on-error event', async () => {
    const form = reactive({ attachment: '' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    const message = wrapper.vm.$message
    await upload(wrapper).props('onError')(new Error('nope'))
    expect(message.error).toHaveBeenCalledWith('nope')
    await upload(wrapper).props('onError')({})
    expect(message.error).toHaveBeenCalledWith('Upload failed')
    wrapper.unmount()
  })

  it('handleExceed resets value and restarts upload via $refs on el-upload on-exceed event', async () => {
    const form = reactive({ attachment: 'old.pdf' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    const uploadVm = upload(wrapper).vm
    uploadVm.clearFiles = vi.fn()
    uploadVm.handleStart = vi.fn()
    uploadVm.submit = vi.fn()
    const files = [{ name: 'huge.pdf' }]
    await upload(wrapper).props('onExceed')(files)
    expect(form.attachment).toBe('')
    await nextTick()
    await nextTick()
    expect(uploadVm.clearFiles).toHaveBeenCalledTimes(1)
    expect(uploadVm.handleStart).toHaveBeenCalledWith(files[0])
    expect(uploadVm.submit).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('on-remove clears the file value via el-upload on-remove event', async () => {
    const form = reactive({ attachment: 'doc.pdf' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    await upload(wrapper).props('onRemove')({ name: 'doc.pdf' }, [])
    expect(form.attachment).toBe('')
    wrapper.unmount()
  })

  it('validates parent form field after success when ancestor exposes validateField', async () => {
    const validateField = vi.fn()
    const form = reactive({ attachment: '' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const ParentHarness = {
      components: { ChildPlugin: FilePlugin },
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
    await childUpload.props('onSuccess')({ data: { path: 'v.pdf' } })
    await nextTick()
    await nextTick()
    expect(form.attachment).toBe('https://cdn.test/v.pdf')
    expect(validateField).toHaveBeenCalledWith('attachment')
    parent.unmount()
  })

  it('renders the file tip text', () => {
    const form = reactive({ attachment: '' })
    const field = reactive({ property: 'attachment', type: 'file' })
    const wrapper = makeWrapper(form, field)
    expect(wrapper.text()).toContain('File must be less than 100MB')
    wrapper.unmount()
  })
})
