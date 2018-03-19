export default class request {
  constructor(action, data, file, headers, model, chunkOptions = {}, method = 'POST', responseType = 'json') {
    this.responseType = responseType
    this.method = method
    this.action = action
    this.headers = headers
    this.data = data
    this.file = file
    this.model = model

    this.thread = chunkOptions.thread || 1
    this.chunkSize = chunkOptions.chunkSize * 1024
    this.chunkSizeKey = chunkOptions.chunkSizeKey
    this.currentChunkSizeKey = chunkOptions.currentChunkSizeKey
    this.totalSizeKey = chunkOptions.totalSizeKey
    this.chunkIndexKey = chunkOptions.chunkIndexKey
    this.totalChunksKey = chunkOptions.totalChunksKey
    this.identifierKey = chunkOptions.identifierKey

    this._body = new FormData()
  }

  get fileSize() {
    return this.file.size
  }

  _setRequestHeader() {
    if (this.headers) {
      Object.keys(this.headers).forEach(name => this.xhr.setRequestHeader(name, this.headers[name]))
    }
  }

  _setCommonBodyFields() {
    if (this.data) {
      Object.keys(this.data).forEach(key => this._body.append(key, this.data[key]))
    }
  }

  send() {
    if (this.chunkSize && this.fileSize > this.chunkSize) {
      return this._chunkUploadSend()
    }
    console.log('11')
    this.xhr = new XMLHttpRequest()
    this.xhr.responseType = this.responseType

    this._setRequestHeader()
    this._setCommonBodyFields()
    return new Promise((resolve, reject) => {

      this._body.append(this.file.name, this.file.file)

      this.xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.file.uploadPercent = Math.round(event.loaded * 100 / event.total)
        } else {
          this.file.uploadPercent = 0
        }
      }, false)

      this.xhr.addEventListener("load", () => {
        if (this.xhr.status >= 200 && this.xhr.status < 300) {
          this.file.uploading = 2
          this.file.response = this.xhr.response
          resolve(this.file)
        } else {
          reject(this.file)
        }
      }, false)

      let _bindErrorEvent = () => {
        this.file.response = this.xhr.response
        reject(this.file)
      }

      this.xhr.addEventListener("error", _bindErrorEvent, false)
      this.xhr.addEventListener("abort", _bindErrorEvent, false)

      this.xhr.open(this.method, this.action, true)
      this.xhr.send(this._body)
    }).catch(file => {
      if (file.maxRetries) {
        file.maxRetries = --file.maxRetries
        this.send()
      }
    })
  }

  _createChunkFormData(blob, index, start, end) {
    let _body = null

    let data = Object.assign({}, this.data, {start: start, end: end})
    data[this.totalSizeKey] = this.file.size
    data[this.chunkIndexKey] = index + 1
    data[this.chunkSizeKey] = this.chunkSize
    data[this.currentChunkSizeKey] = blob.size
    data[this.identifierKey] = this.file.identifier

    if (this.model === 'octet') {
      let params = []
      Object.keys(data).forEach(query => params.push([encodeURIComponent(query), encodeURIComponent(data[query])].join('=')))
      return params
    } else {
      _body = new FormData()
      data[this.file.name] = blob
      Object.keys(data).forEach(key => _body.append(key, data[key]))
      return _body
    }
  }

  _createChunks() {
    this.chunks = []

    let index = 0
    let start = 0
    let end = this.chunkSize

    while (start < this.fileSize) {
      let _blob = this.file.file.slice(start, end)
      let chunk = {
        index: index,
        blob: _blob,
        startOffset: start,
        uploading: 0,
        retries: this.file.maxRetries
      }

      let data = this._createChunkFormData(chunk.blob, index, start, end)
      if (this.model === 'octet') {
        chunk.action = this.action + (this.action.indexOf('?') >= 0 ? '&' : '?') + data.join('&')
      } else {
        chunk.formData = data
      }

      this.chunks.push(chunk)
      index++
      start = end
      end = start + this.chunkSize
    }
    if (this.model === 'octet') {
      return
    }
    this.chunks.forEach(chunk => {
      chunk.formData.append(this.totalChunksKey, index)
    })
  }

  _sendChunk(chunk) {
    chunk.uploading = 1
    let _self = this
    return new Promise((resolve, reject) => {
      _self.xhr = new XMLHttpRequest()
      let action = this.action
      if (_self.model === 'octet') {
        action = chunk.action
        _self.xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      }

      let headers = Object.assign({}, _self.headers)
      Object.keys(headers).forEach(name => _self.xhr.setRequestHeader(name, headers[name]))

      _self.xhr.addEventListener('load', () => {
        if (_self.xhr.status >= 200 && _self.xhr.status < 300) {
          chunk.uploading = 2
          resolve(chunk)
        }
      })

      let accident = () => {
        chunk.uploading = -1
        reject(chunk)
      }

      _self.xhr.addEventListener('error', accident, false)
      _self.xhr.addEventListener('abort', accident, false)
      console.log(_self.method, action)
      _self.xhr.open(_self.method, action)
      _self.xhr.send(chunk.formData ? chunk.formData : chunk.blob)
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
      }).catch(chunk => {
        if (chunk.retries) {
          --chunk.retries
          chunk.uploading = 0
          _self._sendChunkQueue()
        } else {
          _self.file.uploadPercent = 0
          _self.file.uploading = -1
        }
      })
    }
  }

  _chunkUploadSend() {
    this._createChunks()
    this._sendChunkQueue()
  }
}
