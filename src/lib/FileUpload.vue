<template>
  <label class="className">
    <slot></slot>
    <input-file></input-file>
  </label>
</template>
<script>
  import InputFile from './InputFile.vue'
  import features from '../utils/features'
  import File from '../entity/file'
  import Request from '../utils/request'

  export default {
    name: 'vue-resumable',

    components: {
      InputFile,
    },
    props: {
      inputId: {
        type: String,
      },
      name: {
        type: String,
        default: 'file',
      },
      accept: {
        type: String,
      },
      capture: {},
      multiple: {
        type: Boolean,
      },
      directory: {
        type: Boolean,
      },
      postAction: {
        type: String,
      },
      headers: {
        type: Object,
        default: Object,
      },
      data: {
        type: Object,
        default: Object,
      },
      timeout: {
        type: Number,
        default: 0,
      },
      // 是否对新增队列的文件 立即上传
      promptly: {
        type: Boolean,
        default: false,
      },
      // 上传进程数
      thread: {
        type: Number,
        default: 1,
      },
      // 分块大小 单位 0为不开启
      chunkSize: {
        type: Number,
        default: 0
      },
      // 上传失败或遇到异常 重试次数
      maxRetries: {
        type: Number,
        default: 3
      }
    },
    data() {
      return {
        files: [],
        features: features,
        uploading: 0
      }
    },
    watch: {
      files: function () {
        if (!this.promptly) {
          return
        }
        let newFileList = this.newFileList()
        if (newFileList.length) {
          this.upload()
        }
      }
    },
    methods: {
      /**
       * file input change event
       * @param file
       */
      addInputFile: function (el) {
        if (el.files && el.files.length) {
          for (let i = 0; i < el.files.length; i++) {
            let file = el.files[i]
            this.files.push(new File(file, this.maxRetries))
          }
        }
        this.$emit('change', this.files)
      },
      clear: function () {
        this.files = []
      },
      newFileList: function () {
        let newFileList = []
        this.files.forEach(file => {
          if (!file.uploading) {
            newFileList.push(file)
          }
        })
        return newFileList
      },
      _sendRequest: function (file) {
        file.uploading = 1
        let parameters = [this.postAction, this.data, file, this.headers]
        if (this.chunkSize) {
          parameters = [...parameters, this.chunkSize, this.thread]
        }
        let request = new Request(...parameters)
        return request.send()
      },
      upload: function (force = false) {
        if (this.uploading && !force) {
          return
        }
        let newFileList = this.newFileList()
        let total = newFileList.length
        if (!total) {
          return
        }
        let _self = this
        if (this.thread >= total) {
          newFileList.forEach(file => {
            _self._sendRequest(file)
          })
          return
        }
        let fileThread = !this.chunkSize ? this.thread : 1
        for (let i = 0; i < fileThread; i++) {
          let file = newFileList[i]
          if (file.uploading) {
            continue
          }
          _self._sendRequest(file).then(() => {
            _self.upload(true)
          }).catch((file) => {
            file.uploadPercent = 0
            if (file.maxRetries) {
              file.uploading = 0
              --file.maxRetries
            } else {
              file.uploading = -1
            }
            _self.upload(true)
          })
        }
      }
    }
  }
</script>






































