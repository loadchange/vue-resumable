var opn = require('opn')
var fs = require('fs');
var express = require('express')
var webpack = require('webpack')
var multer  = require('multer');
var baseConfig = require('./webpack.base.config')

process.env.NODE_ENV = 'development'

var webpackConfig = Object.assign({}, baseConfig, {
  mode: 'development',
  devtool: '#eval-source-map',
  plugins: [new webpack.HotModuleReplacementPlugin()]
})

var config = {
  dev: {
    port: 8888,
    autoOpenBrowser: true,
    cssSourceMap: false
  }
}

var app = express()
var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {
  }
})


// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

app.use(express.static('./'));

var upload = multer({dest: 'upload_tmp/'});

app.post('/upload-formdata', upload.any(), function(req, res, next) {
  console.log(req.files[0]);  // 上传的文件信息

  var des_file = "./upload/" + req.files[0].originalname;
  fs.readFile( req.files[0].path, function (err, data) {
    fs.writeFile(des_file, data, function (err) {
      if( err ){
        console.log( err );
      }else{
        response = {
          message:'File uploaded successfully',
          filename:req.files[0].originalname
        };
        console.log( response );
        res.end( JSON.stringify( response ) );
      }
    });
  });
});


var uri = 'http://localhost:' + config.dev.port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  if (config.dev.autoOpenBrowser) {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(config.dev.port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
