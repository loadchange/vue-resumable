const _generateAction = (action, query) => {
  if (query) {
    let queryArray = []
    Object.keys(query).forEach(key => {
      queryArray.push([encodeURIComponent(key), encodeURIComponent(query[key])].join('='))
    })
    if (queryArray.length) {
      action += action.match('\\?') ? '&' : '?' + queryArray.join('&')
    }
  }
  return action
}

export default function (options) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    let action = options.query ? _generateAction(options.action, options.query) : options.action

    if (options.progress) {
      xhr.upload.addEventListener('progress', options.progress, false)
    }

    let doneHandler = (event) => {
      xhr.status >= 200 && xhr.status < 300 ? resolve(xhr, event) : reject(event)
    }

    xhr.addEventListener('load', doneHandler, false)
    xhr.addEventListener('error', doneHandler, false)
    xhr.addEventListener('abort', doneHandler, false)
    xhr.addEventListener('timeout', doneHandler, false)

    xhr.open(options.method, action)

    Object.keys(options.headers).forEach(key => xhr.setRequestHeader(key, options.headers[key]))
    xhr.send(options.data)
  })
}
