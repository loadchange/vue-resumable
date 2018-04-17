# vue-resumable

> 这是一个vue上传组件，它支持多线程、分块上传及异常重试

## 使用方法

与其他Vue插件一样，在项目目录安装插件

> npm install vue-resumable

并在Vue入口文件 对插件进行注册 

> Vue.use(VueResumable)

之后可以在组件中使用该插件

###### 参数

- inputId: 注册input file的id
- name: 注册input file的name
- multiple: 是否可以多选
- directory: 是否上传目录
- headers: 自定义header
- requestType: 上传方式，默认:'octet' 其他可选值:'formdata'
- post-action: 上传文件接收请求地址
- thread: 上传线程数，不开启分块上传时指同时上传的文件数，开启分块上传时之同时上传的块数
- chunkSize: 分块大小，单位KB，默认为0，0为不开启分块上传
- maxRetries: 最大重试次数，开启分块时，为单个分块尝试次数，不开启分块则为单个文件尝试次数
- promptly: 是否对新增文件立即上传，默认:false
- progress: 默认:true，是否对XHR绑定progress监听，如果使用CORS跨域上传，打开此功能浏览器会启动preflight(预检请求)，预检会在CORS头返回前发起，会导致上传请求提前因同源策略而终止，需要服务端特殊处理或关闭此功能。

###### 可选参数

> 以下参数用于随上传请求发出 目前不支持关闭

- carryTypeName default: 'resumableType'
- carryFileNameName default: 'resumableFilename'
- carryRelativePathName default: 'resumableRelativePath'
- carryChunkSizeName  'resumableChunkSize'
- carryCurrentChunkSizeName 'resumableCurrentChunkSize'
- carryTotalSizeName  default: 'resumableTotalSize'
- carryChunkIndexName default: 'resumableChunkNumber'
- carryTotalChunksName  default: 'resumableTotalChunks'
- carryIdentifierName default: 'resumableIdentifier'

###### 事件

- change: 当用户选择文件后触发的事件

###### 属性

- files: 组件接收的文件，包括上传完成的与上传中、未上传的全部文件
  - file: 文件对象
  - name: 文件名称
  - size: 文件大小
  - type: 文件类型
  - relativePath
  - lastModified
  - lastModifiedDate
  - uploadPercent 文件上传进度
  - uploading:  文件上传状态 -1:上传失败 0:未上传 1:上传中 2:上传成功
  - url : 当文件类型为image时有此属性，用于预览

```
<template>
  <div id="app">
    <vue-resumable
      inputId="up1"
      name="up1-name"
      :multiple="true"
      :directory="false"
      post-action=""
      :promptly="false"
      :thread="3"
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

```
