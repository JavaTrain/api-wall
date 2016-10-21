var express = require('express');
var router = express.Router();
var Verify = require('./verify');
var fs = require('fs');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.route('/files')
    .post(Verify.verifyOrdinaryUser, function (req, res, next) {
      var name = req.body.file.name.split('.');
      var ext = name.pop();
      name = name.join('.')+'-'+new Date().getTime()+new Date().getUTCMilliseconds()+'.'+ext;
      base64Data = req.body.file.link.split(',')[1];
      fs.writeFile('public/upload/' + name, base64Data, 'base64', function (err) {
        if (err) console.log(err);
      });
      var link = req.protocol + '://' + req.get('host') + '/upload/' + name;

      res.json(
          {
            file: {
              link: link,
              name: name,
              originalName: req.body.file.name,
              mimeType: req.body.file.mimeType
            }
          });
    });

router.route('/files/:fileId')
    .delete(Verify.verifyOrdinaryUser, function (req, res, next) {
      // var name = req.body.file.name.split('.');
      // var ext = name.pop();
      // name = name.join('.')+'-'+new Date().getTime()+new Date().getUTCMilliseconds()+'.'+ext;
      // base64Data = req.body.file.link.split(',')[1];
      // fs.writeFile('public/upload/' + name, base64Data, 'base64', function (err) {
      //   if (err) console.log(err);
      // });
      // var link = req.protocol + '://' + req.get('host') + '/upload/' + name;

      res.json({});
    });

module.exports = router;
