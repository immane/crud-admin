<template>
  <el-upload
    ref="upload"
    v-bind="field.type_options"
    :action="uploadAction"
    :data="uploadData"
    :headers="uploadHeaders"
    :limit="1"
    :file-list="
      form[field.property]
        ? [{name: form[field.property], url: getPicture(form[field.property]) }]
        : []
    "
    list-type="file"
    :on-remove="(file, fileList) => form[field.property] = ''"
    :on-success="handleSuccess"
    :on-exceed="handleExceed"
    :on-error="handleError"
    v-on="field.type_events || {}"
  >
    <el-button size="small" type="primary">{{ $t('Select file') }}</el-button>
    <template #tip><div class="el-upload__tip">{{ $t('File must be less than 100MB') }}</div></template>
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
    getPicture(url) {
      return SIP.getPicture(url)
    },
    handleSuccess(response) {
      this.form[this.field.property] = resolveUploadPath(response) || ''
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
