var baseConfig = require('./webpack.base.config')
var webpack = require('webpack')

var webpackConfig = Object.assign({}, baseConfig, {
  entry: './src/lib/index.js',
  devtool: '#source-map',
  optimization: {
    minimize: true
  },
  mode: 'production'
})

let output = webpackConfig.output
webpackConfig.output = Object.assign({}, output, {
  filename: 'vue-resumable.js',
  library: 'VueResumable',
  libraryTarget: 'umd',
  umdNamedDefine: true
})

webpackConfig.plugins = (webpackConfig.plugins || []).concat([
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: '"production"'
    }
  }),
  new webpack.LoaderOptionsPlugin({
    minimize: true
  })
])

module.exports = webpackConfig
