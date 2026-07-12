<template>
  <el-upload
    ref="upload"
    v-bind="field.type_options"
    :action="`${BASE_API}/upload?storage=qiniu`"
    :limit="1"
    :file-list="
      form[field.property]
        ? [{name: form[field.property], url: getPicture(form[field.property]) }]
        : []
    "
    list-type="file"
    :on-remove="(file, fileList) => form[field.property] = ''"
    :on-success="(res, file) => { form[field.property] = res.data[0] }"
    :on-exceed="handleExceed"
    v-on="field.type_events || {}"
  >
    <el-button size="small" type="primary">Select file</el-button>
    <template #tip><div class="el-upload__tip">File must be less than 100MB</div></template>
  </el-upload>
</template>

<script>
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
  data() {
    return {
      // base api
      BASE_API: process.env.VITE_BASE_API
    }
  },
  methods: {
    getPicture(url) {
      return SIP.getPicture(url)
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
