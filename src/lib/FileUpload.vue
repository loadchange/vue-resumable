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
        let newFileList = []
        this.files.forEach(file => {
          if (file.uploadPercent < 100) {
            newFileList.push(file)
          }
        })
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
      upload: function () {
        let _self = this
        this.files.forEach(file => {
          if (file.uploadPercent < 100) {
            let request = new Request(this.postAction, this.data, file)
            request.send().then(() => {
              console.log(request.file)
            })
          }
        })
      }
    }
  }
</script>






































