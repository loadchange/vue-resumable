<template>
  <div id="app">
    <vue-resumable
      inputId="up1"
      name="up1-name"
      :multiple="true"
      :directory="false"
      post-action="http://127.0.0.1:8888/upload"
      :promptly="false"
      :thread="3"
      :chunkSize="0"
      :progress="true"
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
        uploadData: {memberId: 1}
      }
    },
    methods: {
      change: function () {
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
        this.$refs.resumable.upload().then(list => {
          console.log('队列完成', list)
        })
      }
    }
  }
</script>
