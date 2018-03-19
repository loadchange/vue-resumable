export default class File {
  constructor(file, maxRetries) {
    this.file = file
    this.name = file.name
    this.size = file.size
    this.type = file.type
    this.relativePath = file.webkitRelativePath || file.relativePath || ''
    this.lastModified = file.lastModified
    this.identifier = this.guid()
    this.uploadPercent = 0
    this.uploading = 0 // -1:上传失败 0:未上传 1:上传中 2:上传成功
    this.maxRetries = maxRetries || 1

    if (/^image\/*/.test(file.type)) {
      this.url = this.getObjectURL(file)
    }
  }

  getObjectURL(file) {
    let url = null
    if (window.createObjectURL != undefined) {
      url = window.createObjectURL(file)
    } else if (window.URL != undefined) {
      url = window.URL.createObjectURL(file)
    } else if (window.webkitURL != undefined) {
      url = window.webkitURL.createObjectURL(file)
    }
    return url
  }

  guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16)
    })
  }

}
