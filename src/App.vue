<template>
  <div id="app">
    <h2 class="title">DEMO</h2>
    <div class="container">
      <h5 class="type-title">FORMDATA 不分段</h5>
      <vue-resumable
        inputId="up1"
        name="up1-name"
        :multiple="true"
        :directory="false"
        post-action="http://127.0.0.1:8888/upload-formdata"
        :promptly="true"
        :thread="3"
        :chunkSize="0"
        :progress="true"
        @change="change"
        :data="uploadData"
        requestType="formdata"
        ref="resumable"
      ></vue-resumable>
      <div class="img-list">
        <img v-for="img in imgList" :src="img.url" width="150">
      </div>

      <hr>

      <h5 class="type-title">FORMDATA 分段</h5>
    </div>
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
<style>
  #app {
    padding-top: 30px;
  }

  hr {
    height: 3px;
    margin: 15px 0;
    background: #555555;
  }

  .title {
    color: #ffc66d;
    font-size: 24px;
    text-align: center;
  }

  .container {
    width: 800px;
    padding: 30px;
    margin: 10px auto 0;
    background: #2b2b2b;
  }

  .type-title {
    color: #cc7832;
    font-size: 18px;
    margin-bottom: 10px;
  }

  .img-list {
    margin-top: 10px;
  }
</style>
