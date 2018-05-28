export default class Queue {
  constructor({thread, uploaderList, enableChunk}) {
    this.thread = thread
    this.uploaderList = uploaderList
    this.enableChunk = enableChunk

    let recursive = null
    let list = this._getNotStartUploader()
    return new Promise(resolve => {
      if (this.enableChunk) {
        recursive = () => {
          if (list.length) {
            list[0].send().then(recursive, recursive)
          } else {
            resolve(this.uploaderList)
          }
        }
      } else {
        recursive = () => {
          if (list.length) {
            let count = this.thread > list.length ? list.length : this.thread
            for (let i = 0; i < count - this._getUploadingList(); i++) {
              list[i].send().then(recursive, recursive)
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
