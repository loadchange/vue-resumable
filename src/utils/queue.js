export default class Queue {
  constructor(options) {
    this.thread = options.thread
    this.uploaderList = options.uploaderList
    this.enableChunk = options.enableChunk

    let recursive = null
    let list = null
    return new Promise(resolve => {
      if (this.enableChunk) {
        recursive = () => {
          list = this._getNotStartUploader()
          if (list.length) {
            list[0].send().then(() => recursive()).catch(() => recursive())
          } else {
            resolve(this.uploaderList)
          }
        }
      } else {
        recursive = () => {
          list = this._getNotStartUploader()
          if (list.length) {
            let count = this.thread > list.length ? list.length : this.thread
            for (let i = 0; i < count - this._getUploadingList(); i++) {
              list[i].send().then(() => recursive()).catch(() => recursive())
            }
          } else {
            resolve(this.uploaderList)
          }
        }
      }
      recursive()
    })
  }

  /**
   * 未启动的上传
   * @returns {Array}
   * @private
   */
  _getNotStartUploader() {
    let uploaderList = []
    this.uploaderList.forEach(uploader => {
      if (!uploader.file.uploading) {
        uploaderList.push(uploader)
      }
    })
    return uploaderList
  }

  /**
   * 上传中的列表
   * @returns {Array}
   * @private
   */
  _getUploadingList() {
    let uploaderList = []
    this.uploaderList.forEach(uploader => {
      if (uploader.file.uploading === 1) {
        uploaderList.push(uploader)
      }
    })
    return uploaderList
  }
}
