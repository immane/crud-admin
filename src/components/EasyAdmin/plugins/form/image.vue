<template>
  <el-upload
    v-bind="field.type_options"
    :action="`${BASE_API}/upload`"
    :limit="field.type === 'image' ? 1 : 0"
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
    v-on="field.type_events"
  >
    <el-button size="small" type="primary">点击选择媒体/文件</el-button>
    <div slot="tip" class="el-upload__tip">JPG或PNG文件必须少于10MB</div>
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
      BASE_API: process.env.VUE_APP_BASE_API
    }
  },
  methods: {
    // Get picture
    getPicture(url) { return SIP.getPicture(url) }
  }
}
</script>
