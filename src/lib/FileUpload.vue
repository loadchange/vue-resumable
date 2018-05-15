<template>
  <label class="vue-resumable">
    <slot></slot>
    <input-file></input-file>
  </label>
</template>
<script>
  import InputFile from './InputFile.vue'
  import features from '../utils/features'
  import File from '../entity/file'
  import Queue from '../utils/queue'
  import Upload from '../utils/upload'

  export default {
    name: 'vue-resumable',

    components: {InputFile},
    props: {
      inputId: {
        type: String
      },
      name: {
        type: String,
        default: 'file',
      },
      requestType: {
        type: String,
        default: 'octet',
      },
      capture: {},
      multiple: {
        type: Boolean,
      },
      accept: {
        type: String,
      },
      directory: {
        type: Boolean,
      },
      postAction: {
        type: String,
      },
      headers: {
        type: Object
      },
      data: {
        type: Object
      },
      timeout: {
        type: Number,
        default: 0,
      },
      progress: {
        type: Boolean,
        default: true,
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
      // 分块格式，可选 'blob' 'base64'
      chunkFormat: {
        type: String,
        default: 'blob'
      },
      // 上传失败或遇到异常 重试次数
      maxRetries: {
        type: Number,
        default: 3
      },
      // 同步发送给服务端的参数
      carryTypeName: {type: String, default: 'resumableType'},
      carryFileNameName: {type: String, default: 'resumableFilename'},
      carryRelativePathName: {type: String, default: 'resumableRelativePath'},
      carryChunkSizeName: {type: String, default: 'resumableChunkSize'},
      carryCurrentChunkSizeName: {type: String, default: 'resumableCurrentChunkSize'},
      carryTotalSizeName: {type: String, default: 'resumableTotalSize'},
      carryChunkIndexName: {type: String, default: 'resumableChunkNumber'},
      carryTotalChunksName: {type: String, default: 'resumableTotalChunks'},
      carryIdentifierName: {type: String, default: 'resumableIdentifier'},
    },
    data() {
      return {
        files: [],
        features: features,
        uploading: 0
      }
    },
    watch: {
      files() {
        if (!this.promptly) {
          return
        }
        this.upload()
      }
    },
    methods: {
      selectFile() {
        if (this.inputId) {
          document.getElementById(this.inputId).click()
        }
      },
      /**
       * file input change event
       * @param file
       */
      addInputFile(el) {
        if (el.files && el.files.length) {
          for (let i = 0; i < el.files.length; i++) {
            let file = el.files[i]
            this.files.push(new File(file, this.maxRetries))
          }
        }
        this.$emit('change', this.files)
      },
      clear() {
        this.files = []
      },
      _generateUploader(file) {
        return new Upload({
          action: this.postAction,
          method: 'POST',
          headers: this.headers,
          data: this.data,
          file: file,
          progress: this.progress,
          requestType: this.requestType,
          chunk: {
            thread: this.thread,
            chunkSize: this.chunkSize,
            chunkFormat: this.chunkFormat,
            carryChunkSizeName: this.carryChunkSizeName,
            carryCurrentChunkSizeName: this.carryCurrentChunkSizeName,
            carryTotalSizeName: this.carryTotalSizeName,
            carryChunkIndexName: this.carryChunkIndexName,
            carryTotalChunksName: this.carryTotalChunksName,
            carryIdentifierName: this.carryIdentifierName
          },
          carryTypeName: this.carryTypeName,
          carryFileNameName: this.carryFileNameName,
          carryRelativePathName: this.carryRelativePathName
        })
      },
      _getUploaderList() {
        let _self = this
        let uploaderList = []
        this.files.forEach(file => {
          if (!file.uploading) {
            uploaderList.push(_self._generateUploader(file))
          }
        })
        return uploaderList
      },
      upload() {
        let _self = this
        let queue = {
          thread: this.thread,
          uploaderList: this._getUploaderList(),
          enableChunk: this.chunkSize
        }

        function complete() {
          _self.$emit('complete', _self.files)
        }

        if (this.uploading) {
          return new Promise(resolve => {
            _self.__uploadingTime__ = setInterval(() => {
              if (!_self.uploading) {
                complete()
                window.clearInterval(_self.__uploadingTime__)
                resolve()
              }
            }, 333)
          }).then(() => {
            return new Queue(queue).then(() => _self.uploading = 0)
          })
        }
        return new Queue(queue).then(() => {
          complete()
          _self.uploading = 0
        })
      }
    }
  }
</script>






































