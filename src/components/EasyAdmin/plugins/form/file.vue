<template>
  <el-upload
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
    v-on="field.type_events"
  >
    <el-button size="small" type="primary">点击选择文件</el-button>
    <template #tip><div class="el-upload__tip">上传文件必须少于100MB</div></template>
  </el-upload>
</template>

<script>
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
  }
}
</script>
