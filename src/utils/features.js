export default new function () {
  let input = document.createElement('input')
  input.type = 'file'
  input.multiple = true

  let features = {}
  features.html5 = window.FormData && input.files && true

  if (features.html5) {
    features.directory = typeof input.webkitdirectory === 'boolean' || typeof input.directory === 'boolean'
    features.drop = typeof input.ondrop !== 'undefined'
  }

  return features

}
