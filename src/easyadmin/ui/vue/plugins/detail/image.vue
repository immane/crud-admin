<template>
  <span>
    <el-image
      style="width: 100%; height: 100%; border: 3px white solid; box-shadow: 1px 1px 5px #ddd;"
      :src="imageUrl"
      :preview-src-list="[imageUrl]"
      preview-teleported
      :z-index="3000"
    />
  </span>
</template>

<script>
import SIP from '@/utils/simple-image-process'

export default {
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  computed: {
    imageUrl() {
      return SIP.getPicture(this.value)
    }
  }
}
</script>
