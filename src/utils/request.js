const creatXMLHttpRequest = (action, method, headers, query) => {
  let xhr = new XMLHttpRequest()
  Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]))

  if (query) {
    let queryArray = []
    Object.keys(query).forEach(key => {
      queryArray.push([encodeURIComponent(key), encodeURIComponent(query[key])].join('='))
    })
    if (queryArray.length) {
      action += action.match('\\?') ? '&' : '?' + query.join('&')
    }
  }

  // xhr.open(method, action)
  return xhr
}

export default function (options) {
  return new Promise((resolve, reject) => {
    console.log(options)
    // let xhr = creatXMLHttpRequest(options.action, options.method, options.headers, options.query)

    let xhr = new XMLHttpRequest()
    Object.keys(options.headers).forEach(key => xhr.setRequestHeader(key, options.headers[key]))

    if (options.query) {
      let queryArray = []
      Object.keys(options.query).forEach(key => {
        queryArray.push([encodeURIComponent(key), encodeURIComponent(options.query[key])].join('='))
      })
      if (queryArray.length) {
        options.action += options.action.match('\\?') ? '&' : '?' + queryArray.join('&')
      }
    }

    if (options.progress) {
      xhr.upload.addEventListener('progress', options.progress, false)
    }

    let doneHandler = (event) => {
      xhr.status >= 200 && xhr.status < 300 ? resolve(xhr, event) : reject(xhr, event)
    }

    xhr.addEventListener('load', doneHandler, false)
    xhr.addEventListener('error', doneHandler, false)
    xhr.addEventListener('abort', doneHandler, false)

    xhr.open(options.method, options.action)
    xhr.send(options.data)
  })
}
