var express = require('express');
var multer = require('multer');
var md5 = require('md5');

var app = express();

app.use(express.static('./'));

app.post('/upload', function (req, res, next) {
  console.log(req.body, req.files);
  res.send('success');
  // var tmp_path = req.files.thumbnail.path;
  // var target_path = './uploads/' + req.files.thumbnail.name;
  // fs.rename(tmp_path, target_path, function (err) {
  //   if (err) throw err;
  //   // 删除临时文件夹文件,
  //   fs.unlink(tmp_path, function () {
  //     if (err) throw err;
  //     res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
  //   });
  // })
});

app.get('/upload', function (req, res) {
  res.send('This is an upload test service, please use POST.');
});


var server = app.listen(8888, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
