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
        @change="change(1)"
        :data="uploadData"
        requestType="formdata"
        ref="resumable1"
      ></vue-resumable>
      <div class="img-list">
        <img v-for="img in imgList1" :src="img.url" width="150">
      </div>
      <button class="select-file-btn" @click="selectFile">SELECT-FILE</button>

      <hr>

      <h5 class="type-title">FORMDATA 分段</h5>
      <vue-resumable
        inputId="up2"
        name="up2-name"
        :multiple="true"
        :directory="false"
        post-action="http://127.0.0.1:8888/upload-formdata-chunks"
        :promptly="true"
        :thread="3"
        :chunkSize="500"
        :progress="true"
        @change="change(2)"
        :data="uploadData"
        requestType="formdata"
        ref="resumable2"
      ></vue-resumable>
      <div class="img-list">
        <img v-for="img in imgList2" :src="img.url" width="150">
      </div>

      <h5 class="type-title">OCTET 分段</h5>
      <vue-resumable
        inputId="up3"
        name="up3-name"
        :multiple="true"
        :directory="false"
        post-action="http://127.0.0.1:8888/upload-octet-chunks"
        :promptly="true"
        :thread="3"
        :chunkSize="500"
        @change="change(3)"
        @complete="complete(files)"
        :data="uploadData"
        ref="resumable3"
      ></vue-resumable>
      <div class="img-list">
        <div v-for="img in imgList3" class="item">
          <img :src="img.url" width="150">
          <span class="percent">上传进度：{{img.uploadPercent}}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  export default {
    data: function () {
      return {
        imgList1: {},
        imgList2: {},
        imgList3: {},
        files: null,
        uploadData: {memberId: 1}
      }
    },
    methods: {
      selectFile() {
        this.$refs.resumable1.selectFile()
      },
      change(idx) {
        let _self = this
        let resumable = this.$refs['resumable' + idx]
        resumable.files.forEach(file => {
          if (file.url) {
            _self['imgList' + idx][file.identifier] = file
          }
        })
        _self['imgList' + idx] = Object.assign({}, _self['imgList' + idx], {})
      },
      complete(files) {

        files.forEach(file => {
          // Extract server response from the `xhr` property of each file object
          const serverResponse = JSON.parse(file.xhr.responseText);
          // Implement logic to save data based on the server response
          // This is a placeholder for actual data saving logic
          console.log('Server response:', serverResponse);
          // Assuming serverResponse contains necessary data to be saved to a database
          // saveDataToDatabase(serverResponse); // Placeholder function for saving data to a database
        });
      },
      upload() {
        console.log('App upload')
        this.$refs.resumable.upload().then(list => {
          console.log('Queue completed', list)
        })
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.files = this.$refs.resumable3.files
        this.$nextTick()
      })
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
    overflow: hidden;
  }

  .img-list .item {
    position: relative;
    float: left;
    height: 122px;
    width: 150px;
    border: 1px solid #cc7832;
    overflow: hidden;
  }

  .img-list .item img {
    max-height: 122px;
    max-width: 150px;
  }

  .percent {
    position: absolute;
    bottom: 2px;
    left: 0;
    right: 0;
    font-size: 16px;
    color: beige;
    text-align: center;
    background: #333;
  }

  .select-file-btn {
    padding: 5px;
    font-size: 20px;
  }
</style>
