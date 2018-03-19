export default class request {
  constructor(action, data, file, headers, chunkSize, thread = 1, method = 'POST', responseType = 'json') {
    this.xhr = new XMLHttpRequest()
    this.xhr.responseType = responseType
    this.method = method
    this.action = action
    this.headers = headers
    this.data = data
    this.file = file
    this.chunkSize = chunkSize * 1024
    this.thread = thread
    this._body = new FormData()
  }

  get fileSize() {
    return this.file.size
  }

  _setRequestHeader() {
    if (this.headers) {
      Object.keys(this.headers).forEach(name => this.xhr.setRequestHeader(value, this.headers[name]))
    }
  }

  _setCommonBodyFields() {
    if (this.data) {
      Object.keys(this.data).forEach(key => this._body.append(key, this.data[key]))
    }
  }

  _bindErrorEvent() {
    this.xhr.addEventListener("error", () => {
      this.file.response = this.xhr.response
      reject(this.file)
    }, false)
    this.xhr.addEventListener("abort", () => {
      this.file.response = this.xhr.response
      reject(this.file)
    }, false)
  }

  send() {
    if (this.chunkSize && this.fileSize > this.chunkSize) {
      return this._chunkUploadSend()
    }
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

      this._bindErrorEvent()

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
    let _body = new FormData()
    Object.keys(this.data).forEach(key => _body.append(key, this.data[key]))
    _body.append(this.file.name, blob)
    _body.append('index', index)
    _body.append('start', start)
    _body.append('end', end)
    return _body
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
      chunk.formData = this._createChunkFormData(chunk.blob, index, start, end)
      this.chunks.push(chunk)
      index++
      start = end
      end = start + this.chunkSize
    }
    console.log(this.chunks)
  }

  _sendChunk(chunk) {
    chunk.uploading = 1
    let _self = this
    return new Promise((resolve, reject) => {
      _self.xhr = new XMLHttpRequest()
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

      _self.xhr.open(this.method, this.action, true)
      _self.xhr.send(chunk.formData)
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
