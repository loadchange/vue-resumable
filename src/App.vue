<template>
  <div id="app">
    <vue-resumable
      inputId="up1"
      name="up1-name"
      :multiple="true"
      :directory="false"
      post-action="http://www.html7.top/xianyu/comment/getFileLoud"
      :promptly="false"
      :thread="1"
      @change="change"
      :data="uploadData"
      ref="resumable"
    ></vue-resumable>
    <div>
      <img v-for="img in imgList" :src="img.url" width="150">
    </div>
    <button @click="upload">upload</button>
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        imgList: [],
        uploadData: {uploadType: 1, id: 22}
      }
    },
    methods: {
      change: function () {
        console.log('change')
        let _self = this
        let resumable = this.$refs.resumable
        resumable.files.forEach(file => {
          if (file.url) {
            _self.imgList.push(file)
          }
        })
      },
      upload: function () {
        console.log('App upload')
        this.$refs.resumable.upload()
      }
    }
  }
</script>
