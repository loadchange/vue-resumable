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
      maximum: {
        type: Number,
        default() {
          return this.multiple ? 0 : 1
        }
      },
      directory: {
        type: Boolean,
      },
      postAction: {
        type: String,
      },
      putAction: {
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
    },
    data() {
      return {
        files: [],
        features: features,
        active: false,
        dropActive: false,
        uploading: 0,
        destroy: false,
      }
    },
    mounted() {
    },
    beforeDestroy() {
      this.destroy = true
      this.active = false
    },
    computed: {},
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
            this.files.push(new File(file))
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
        let request = new Request(this.postAction, this.data, file)
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
        for (let i = 0; i < this.thread; i++) {
          let file = newFileList[i]
          if (file.uploading) {
            continue
          }
          _self._sendRequest(file).then(() => {
            _self.upload(true)
          })
        }
      }
    }
  }
</script>






































