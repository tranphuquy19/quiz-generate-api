var express = require('express');
var router = express.Router();
const readExcelFile = require('read-excel-file/node');
const fs = require('fs');
const _ = require('lodash');
const {xlsDir} = require('../configs');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let xlsFile = req.files.xlsFile;

  // Use the mv() method to place the file somewhere on your server
  xlsFile.mv(`${xlsDir}/${xlsFile.name}`, function (err) {
    if (err)
      return res.status(500).json(err);

    res.status(201).json({message: 'Upload successful'})
  });
});

router.get('/generate', (req, res, next) => {
  let { xlsFile, filters, sheet, isGenerate } = req.body;

  readExcelFile(fs.createReadStream(`D:/generate-quiz/public/xls/${xlsFile}.xlsx`), { sheet: sheet | 1 }).then(data => {
    data.splice(0, 1);
    let temp = [];
    data.map(e => temp.push({
      id: e[0],
      lesson: e[1],
      stt: e[2],
      tl: e[3],
      category: e[4],
      name: e[5],
      kanji: e[6],
      hanViet: e[7],
      meaning: e[8]
    }));

    if (filters) {
      Object.keys(filters).map(e => {
        temp = temp.filter(t => {
          return t[e] === filters[e];
        });
      });
    }
    if (isGenerate) {
      let generated = [];
      generated = temp.map(e => {
        let otherAns = temp.filter(f => { return e.name !== f.name });

        otherAns = _.shuffle(otherAns);

        let j = { ...e };
        j.a = e.name;
        j.b = otherAns.pop().name;
        j.c = otherAns.pop().name;
        j.d = otherAns.pop().name;
        return j;
      });
      res.json(generated);
    } else {
      res.json(temp);
    }
  });
});

router.get('/metadata', (req, res, next) => {
  let { xlsFile, filters, sheet, isGenerate } = req.body;
});

module.exports = router;
