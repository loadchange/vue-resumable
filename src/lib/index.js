import FileUpload from './FileUpload'

const VueResumable = {
  install(Vue, options) {
    Vue.component(FileUpload.name, FileUpload)
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueResumable)
}

export default VueResumable
