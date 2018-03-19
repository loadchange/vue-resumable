import request from './request'

export default class Uploader {
  constructor(options) {
    this.action = options.action
    this.method = options.method
    this.headers = options.headers
    this.data = options.data
    this.file = options.file
    this.requestType = options.requestType

    this.thread = options.chunk.thread
    this.chunkSize = options.chunk.chunkSize * 1024

    // 携带参数KEY
    this.carryTypeName = options.carryTypeName
    this.carryFileNameName = options.carryFileNameName
    this.carryRelativePathName = options.carryRelativePathName
    this.carryChunkSizeName = options.chunk.carryChunkSizeName
    this.carryCurrentChunkSizeName = options.chunk.carryCurrentChunkSizeName
    this.carryTotalSizeName = options.chunk.carryTotalSizeName
    this.carryChunkIndexName = options.chunk.carryChunkIndexName
    this.carryTotalChunksName = options.chunk.carryTotalChunksName
    this.carryIdentifierName = options.chunk.carryIdentifierName
  }

  /**
   * 返回公共参数
   * @param totalSize 文件总大小
   * @param chunkSize 分块大小
   * @param currentChunkSize  当前分块大小
   * @param chunkIndex  当前分块index
   * @param totalChunks 分块总量
   * @param identifier  文件唯一标识
   * @private
   */
  _getCommonArguments(options) {
    let data = {}
    data[this.carryTypeName] = this.file.type
    data[this.carryFileNameName] = this.file.name
    data[this.carryRelativePathName] = this.file.relativePath
    data[this.carryTotalSizeName] = this.file.size
    data[this.carryChunkSizeName] = options.chunkSize
    data[this.carryCurrentChunkSizeName] = options.currentChunkSize
    data[this.carryChunkIndexName] = options.chunkIndex
    data[this.carryTotalChunksName] = options.totalChunks
    data[this.carryIdentifierName] = this.file.identifier
    return data
  }


  send() {
    if (this.file.uploading) {
      return
    }
    // 分块上传
    if (this.chunkSize && this.file.size > this.chunkSize) {
      return this._chunkUploadSend()
    }
    return this._entiretyUpload()
  }

  get requestOptions() {
    return {
      action: this.action,
      method: this.method,
      headers: this.headers
    }
  }

  _setBodyFields(formData, data) {
    Object.keys(data).forEach(key => formData.append(key, data[key]))
    return formData
  }

  /**
   * 整体上传
   * @returns {Promise<T>}
   * @private
   */
  _entiretyUpload() {
    let options = {
      ...this.requestOptions,
      progress: (event) => {
        if (event.lengthComputable) {
          this.file.uploadPercent = Math.round(event.loaded * 100 / event.total)
        } else {
          this.file.uploadPercent = 0
        }
      }
    }

    let params = Object.assign({},
      // 非分块上传时,公共参数 块大小,当前块大小都是文件大小,index:1,总块数:1
      this._getCommonArguments(this.file.size, this.file.size, 1, 1),
      this.data)
    if (this.requestType === 'octet') {
      options.query = params
      options.data = this.file.file
    } else {
      params[this.file.name] = this.file.file
      options.data = this._setBodyFields(new FormData(), params)
    }
    this.file.uploading = 1
    return request(options).then(() => {
      this.file.uploading = 2
      return this.file
    }).catch(() => {
      if (this.file.retries) {
        --this.file.retries
        this.file.uploading = 0
        this.send()
      } else {
        this.file.uploading = -1
        return this.file
      }
    })
  }

  _createChunkOptions(blob, index, start, end) {
    let options = Object.assign({}, this.requestOptions)

    let params = Object.assign(
      this._getCommonArguments({
        chunkSize: this.chunkSize,
        currentChunkSize: blob.size,
        chunkIndex: index + 1,
        totalChunks: 1
      }),
      this.data, {start: start, end: end})

    if (this.requestType === 'octet') {
      options.query = params
      options.data = blob
    } else {
      params[this.file.name] = blob
      options.data = this._setBodyFields(new FormData(), params)
    }

    return options
  }

  _createChunks() {
    this.chunks = []

    let index = 0
    let start = 0
    let end = this.chunkSize

    while (start < this.file.size) {
      let _blob = this.file.file.slice(start, end)
      let chunk = {
        index: index,
        blob: _blob,
        startOffset: start,
        uploading: 0,
        retries: this.file.maxRetries
      }

      chunk.options = this._createChunkOptions(chunk.blob, index, start, end)
      this.chunks.push(chunk)
      index++
      start = end
      end = start + this.chunkSize
    }
    let _self = this
    this.chunks.forEach(chunk => {
      if (_self.requestType === 'octet') {
        chunk.options.query[_self.carryTotalChunksName] = index
      } else {
        chunk.options.data.append(_self.carryTotalChunksName, index)
      }
    })
  }

  _sendChunk(chunk) {
    if (chunk.uploading) {
      return
    }

    chunk.uploading = 1
    return request(chunk.options).then(() => {
      chunk.uploading = 2
    }).catch(() => {
      if (chunk.retries) {
        --chunk.retries
        chunk.uploading = 0
        this._sendChunk(chunk)
      } else {
        chunk.uploading = -1
        this.file.uploading = -1
        this.file.uploadPercent = 0
      }
    })
  }

  _getCompleteChunkList() {
    let completeChunkList = []
    this.chunks.forEach(chunk => {
      if (chunk.uploading === 2) {
        completeChunkList.push(chunk)
      }
    })
    return completeChunkList
  }

  _getNewChunkList() {
    let newChunkList = []
    this.chunks.forEach(chunk => {
      if (!chunk.uploading) {
        newChunkList.push(chunk)
      }
    })
    return newChunkList
  }

  _sendChunkQueue() {
    let newChunkList = this._getNewChunkList()
    let _self = this
    let threadCount = newChunkList.length > this.thread ? this.thread : newChunkList.length
    for (let i = 0; i < threadCount; i++) {
      this._sendChunk(newChunkList[i]).then(() => {
        _self.file.uploadPercent = Math.round(_self._getCompleteChunkList().length * 100 / _self.chunks.length)
        _self._sendChunkQueue()
      })
    }
  }

  _chunkUploadSend() {
    this._createChunks()
    this._sendChunkQueue()
  }
}
