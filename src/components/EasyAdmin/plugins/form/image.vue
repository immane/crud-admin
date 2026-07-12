<template>
  <el-upload
    ref="upload"
    v-bind="field.type_options"
    :action="`${BASE_API}/upload`"
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
    :on-success="(res, file) => {
      if(field.type === 'image') {
        form[field.property] = res.data[0]
      }
      else {
        if(!Object.keys(form).includes(field.property) || !Array.isArray(form[field.property])) form[field.property] = []
        form[field.property] = [...form[field.property], ...res.data]
      }
    }"
    :on-exceed="handleExceed"
    v-on="field.type_events || {}"
  >
    <el-button size="small" type="primary">{{ $t('Select media/file') }}</el-button>
    <template #tip><div class="el-upload__tip">{{ $t('JPG or PNG must be less than 10MB') }}</div></template>
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
    // Get picture
    getPicture(url) { return SIP.getPicture(url) },
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
