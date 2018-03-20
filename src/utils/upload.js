import request from './request'

export default class Uploader {
  constructor(options) {
    this.action = options.action
    this.method = options.method
    this.headers = options.headers
    this.data = options.data
    this.file = options.file
    this.progress = options.progress
    this.requestType = options.requestType

    this.thread = options.chunk.thread
    this.chunkSize = options.chunk.chunkSize * 1024

    // 携带参数KEY
    this.carryParamName = {
      typeName: options.carryTypeName,
      fileNameName: options.carryFileNameName,
      relativePathName: options.carryRelativePathName,
      chunkSizeName: options.chunk.carryChunkSizeName,
      currentChunkSizeName: options.chunk.carryCurrentChunkSizeName,
      totalSizeName: options.chunk.carryTotalSizeName,
      chunkIndexName: options.chunk.carryChunkIndexName,
      totalChunksName: options.chunk.carryTotalChunksName,
      identifierName: options.chunk.carryIdentifierName
    }

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
    data[this.carryParamName.typeName] = this.file.type
    data[this.carryParamName.fileNameName] = this.file.name
    data[this.carryParamName.relativePathName] = this.file.relativePath
    data[this.carryParamName.totalSizeName] = this.file.size
    data[this.carryParamName.chunkSizeName] = options.chunkSize
    data[this.carryParamName.currentChunkSizeName] = options.currentChunkSize
    data[this.carryParamName.chunkIndexName] = options.chunkIndex
    data[this.carryParamName.totalChunksName] = options.totalChunks
    data[this.carryParamName.identifierName] = this.file.identifier
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
    let options = this.requestOptions
    if (this.progress) {
      options.progress = (event) => {
        if (event.lengthComputable) {
          this.file.uploadPercent = Math.round(event.loaded * 100 / event.total)
        } else {
          this.file.uploadPercent = 0
        }
      }
    }

    let sendUpload = () => {
      this.file.uploading = 1
      return request(options).then((xhr, event) => {
        this.file.uploading = 2
        this.file.xhr = xhr
        this.file.event = event
        return this.file
      }).catch(event => {
        if (this.file.retries) {
          --this.file.retries
          this.file.uploading = 0
          this.send()
        } else {
          this.file.event = event
          this.file.uploading = -1
          return this.file
        }
      })
    }

    let params = Object.assign({},
      // 非分块上传时,公共参数 块大小,当前块大小都是文件大小,index:1,总块数:1
      this._getCommonArguments({
        chunkSize: this.file.size,
        currentChunkSize: this.file.size,
        chunkIndex: 1,
        totalChunks: 1
      }),
      this.data)

    if (this.requestType === 'octet') {
      options.query = params
      return new Promise(resolve => {
        let fr = new FileReader()
        fr.onload = () => {
          options.data = fr.result
          resolve(sendUpload())
        }
        fr.readAsDataURL(this.file.file)
      })
    } else {
      params[this.file.name] = this.file.file
      options.data = this._setBodyFields(new FormData(), params)
      return sendUpload()
    }
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
      this.data, {
        start: start,
        end: end
      })

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
      chunk.total = index
      if (_self.requestType === 'octet') {
        chunk.options.query[_self.carryParamName.totalChunksName] = index
      } else {
        chunk.options.data.append(_self.carryParamName.totalChunksName, index)
      }
    })
  }

  _setFileUploadResult(chunk, event, xhr) {
    if (!this.file.chunk) {
      this.file.chunk = {xhr: {}, event: {}}
    }
    if (xhr) {
      this.file.chunk.xhr[chunk.index] = xhr
    }
    if (event) {
      this.file.chunk.event[chunk.index] = event
    }
    if (Object.keys(this.file.chunk.xhr).length === chunk.total) {
      this.file.uploading = 2
    }
  }

  _sendChunk(chunk) {
    if (chunk.uploading) {
      return
    }
    chunk.uploading = 1
    return request(chunk.options).then((xhr, event) => {
      chunk.uploading = 2

      this._setFileUploadResult(chunk, event, xhr)
    }).catch(event => {
      if (chunk.retries) {
        --chunk.retries
        chunk.uploading = 0
        this._sendChunk(chunk)
      } else {
        chunk.uploading = -1
        this.file.uploading = -1
        this.file.uploadPercent = 0
        this._setFileUploadResult(chunk, event)
      }
    })
  }

  _getUploadingChunkList() {
    let chunkList = []
    this.chunks.forEach(chunk => {
      if (chunk.uploading === 1) {
        chunkList.push(chunk)
      }
    })
    return chunkList
  }

  _getNewChunkList() {
    // 文件被标记上传失败,有其他块失败次数达到上限
    if (this.file.uploading < 0) {
      return []
    }
    let newChunkList = []
    this.chunks.forEach(chunk => {
      if (!chunk.uploading) {
        newChunkList.push(chunk)
      }
    })
    return newChunkList
  }

  _sendChunkQueue() {
    return new Promise(resolve => {
      let recursive = () => {
        let newChunkList = this._getNewChunkList()
        if (!newChunkList.length) {
          resolve(this.file)
          return
        }
        let threadCount = newChunkList.length > this.thread ? this.thread : newChunkList.length
        threadCount -= this._getUploadingChunkList()
        if (threadCount <= 0) {
          return
        }
        for (let i = 0; i < threadCount; i++) {
          this._sendChunk(newChunkList[i]).then(() => recursive()).catch(() => recursive())
        }
      }
      recursive()
    })
  }

  _chunkUploadSend() {
    this._createChunks()
    this.file.uploading = 1
    return this._sendChunkQueue()
  }
}
