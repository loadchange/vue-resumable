export default class request {
  constructor(action, data, file, method = 'POST', responseType = 'json') {
    this.xhr = new XMLHttpRequest()
    this.xhr.responseType = responseType
    this.method = method
    this.action = action
    this.data = data
    this.file = file
  }

  send() {
    return new Promise((resolve, reject) => {
      let body = new FormData()
      Object.keys(this.data).forEach(key => {
        body.append(key, this.data[key])
      })
      body.append(this.file.name, this.file.file)

      this.xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          let percentComplete = Math.round(event.loaded * 100 / event.total)
          this.file.uploadPercent = percentComplete
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

      this.xhr.addEventListener("error", () => {
        this.file.response = this.xhr.response
        reject(this.file)
      }, false)
      this.xhr.addEventListener("abort", () => {
        this.file.response = this.xhr.response
        reject(this.file)
      }, false)

      this.xhr.open(this.method, this.action, true)
      this.xhr.send(body)
    })
  }
}
