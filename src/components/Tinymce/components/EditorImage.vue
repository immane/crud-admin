<template>
  <div class="upload-container">
    <el-button :style="{background:color,borderColor:color}" icon="el-icon-upload" size="small" type="primary" @click=" dialogVisible=true">
      {{ $t('Upload') }}
    </el-button>
    <el-dialog v-model="dialogVisible" class="el-upload-popup" append-to-body align-center>
      <el-upload
        drag
        :multiple="true"
        :file-list="fileList"
        :show-file-list="true"
        :on-remove="handleRemove"
        :on-success="handleSuccess"
        :before-upload="beforeUpload"
        :data="uploadData"
        :headers="uploadHeaders"
        class="editor-slide-upload"
        :action="uploadAction"
        list-type="picture"
      >
        <el-icon><el-icon-upload /></el-icon>
        <div class="el-upload__text" v-html="$t('Drag images here or &lt;em&gt;click to upload&lt;/em&gt;')"></div>
      </el-upload>
      <el-button @click="dialogVisible = false">
        Cancel
      </el-button>
      <el-button type="primary" @click="handleSubmit">
        Confirm
      </el-button>
    </el-dialog>
  </div>
</template>

<script>
import { getUploadData, getUploadHeaders, getUploadUrl, resolveUploadPath } from '@/utils/upload'

export default {
  name: 'EditorSlideUpload',
  props: {
    color: {
      type: String,
      default: '#1890ff'
    }
  },
  data() {
    return {
      dialogVisible: false,
      listObj: {},
      fileList: []
    }
  },
  computed: {
    uploadAction() {
      return getUploadUrl()
    },
    uploadData() {
      return getUploadData()
    },
    uploadHeaders() {
      return getUploadHeaders()
    }
  },
  methods: {
    checkAllSuccess() {
      return Object.keys(this.listObj).every(item => this.listObj[item].hasSuccess)
    },
    handleSubmit() {
      const arr = Object.keys(this.listObj).map(v => this.listObj[v])
      if (!this.checkAllSuccess()) {
        this.$message('Please wait for all images to be uploaded successfully. If there is a network problem, please refresh the page and upload again!')
        return
      }
      this.$emit('successCBK', arr)
      this.listObj = {}
      this.fileList = []
      this.dialogVisible = false
    },
    handleSuccess(response, file) {
      const uid = file.uid
      const objKeyArr = Object.keys(this.listObj)
      for (let i = 0, len = objKeyArr.length; i < len; i++) {
        if (this.listObj[objKeyArr[i]].uid === uid) {
          this.listObj[objKeyArr[i]].url = resolveUploadPath(response)
          this.listObj[objKeyArr[i]].hasSuccess = true
          return
        }
      }
    },
    handleRemove(file) {
      const uid = file.uid
      const objKeyArr = Object.keys(this.listObj)
      for (let i = 0, len = objKeyArr.length; i < len; i++) {
        if (this.listObj[objKeyArr[i]].uid === uid) {
          delete this.listObj[objKeyArr[i]]
          return
        }
      }
    },
    beforeUpload(file) {
      const _self = this
      const _URL = window.URL || window.webkitURL
      const fileName = file.uid
      this.listObj[fileName] = {}
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = _URL.createObjectURL(file)
        img.onload = function() {
          _self.listObj[fileName] = { hasSuccess: false, uid: file.uid, width: this.width, height: this.height }
        }
        resolve(true)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.el-overlay-dialog:has(.el-upload-popup)) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-popup) {
  width: min(680px, calc(100vw - 32px)) !important;
  max-height: calc(100vh - 32px);
  margin: auto !important;
}

:deep(.el-upload-popup .el-dialog__body) {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.editor-slide-upload {
  margin-bottom: 20px;
  :deep(.el-upload--picture-card) {
    width: 100%;
  }
}
</style>
