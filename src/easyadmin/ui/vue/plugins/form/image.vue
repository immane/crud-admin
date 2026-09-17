<template>
  <el-upload
    ref="upload"
    v-bind="field.type_options"
    :action="uploadAction"
    :data="uploadData"
    :headers="uploadHeaders"
    :limit="field.type === 'image' ? 1 : undefined"
    :accept="field.type_options?.accept || 'image/*'"
    :file-list="
      form[field.property]
        ? ( field.type === 'image'
          ? [{name: form[field.property], url: getPicture(form[field.property]) }]
          : form[field.property].map(photo => { return { name: photo, url: getPicture(photo) } })
        )
        : []
    "
    list-type="picture"
    :on-remove="(file, fileList) => {
      if(field.type === 'image') form[field.property] = ''
      else form[field.property] = fileList.map(photo => photo.name)
    }"
    :on-success="handleSuccess"
    :on-exceed="handleExceed"
    :on-error="handleError"
    v-on="field.type_events || {}"
  >
    <el-button size="small" type="primary">{{ $t('Select media/file') }}</el-button>
    <template #tip><div class="el-upload__tip">{{ $t('JPG or PNG must be less than 10MB') }}</div></template>
  </el-upload>
</template>

<script>
import { getUploadData, getUploadHeaders, getUploadUrl, resolveUploadPath } from '@/utils/upload'
import SIP from '@/utils/simple-image-process'
export default {
  props: {
    form: {
      type: Object,
      default: () => { return {} }
    },
    field: {
      type: Object,
      default: () => { return {} }
    }
  },
  computed: {
    uploadAction() {
      return getUploadUrl()
    },
    uploadData() {
      return { ...getUploadData(this.field.type_options?.storage), ...(this.field.type_options?.data || {}) }
    },
    uploadHeaders() {
      return { ...(this.field.type_options?.headers || {}), ...getUploadHeaders() }
    }
  },
  methods: {
    getPicture(url) { return SIP.getPicture(url) },
    handleSuccess(response) {
      const path = resolveUploadPath(response)
      if (!path) return
      if (this.field.type === 'image') {
        this.form[this.field.property] = path
      } else {
        if (!Array.isArray(this.form[this.field.property])) this.form[this.field.property] = []
        this.form[this.field.property] = [...this.form[this.field.property], path]
      }
      this.validateField()
    },
    validateField() {
      let parent = this.$parent
      while (parent) {
        if (parent.$refs?.form?.validateField) {
          this.$nextTick(() => parent.$refs.form.validateField(this.field.property))
          return
        }
        parent = parent.$parent
      }
    },
    handleError(error) {
      this.$message.error(error.message || 'Upload failed')
    },
    handleExceed(files) {
      this.form[this.field.property] = ''
      const upload = this.$refs.upload
      this.$nextTick(() => {
        upload.clearFiles()
        upload.handleStart(files[0])
        upload.submit()
      })
    }
  }
}
</script>
