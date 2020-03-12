var express = require('express');
var router = express.Router();
const readExcelFile = require('read-excel-file/node');
const fs = require('fs');
const _ = require('lodash');
const { xlsDir } = require('../configs');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/index.html');
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

    res.status(201).json({ message: 'Upload successful' })
  });
});

router.post('/kanji', (req, res, next) => {
  let { xlsFile, sheet, isGenerate, partionLesson } = req.body;
  console.log(req.body);
  if (fs.existsSync(`${xlsDir}/${xlsFile}.xlsx`)) {
    readExcelFile(fs.createReadStream(`${xlsDir}/${xlsFile}.xlsx`), { sheet: sheet | 1 }).then(data => {
      data.splice(0, 1);
      let temp = [];
      let id = 0;
      let kanjiLessons = new Set();
      data.map(e => temp.push({
        id: id++,
        kanji: e[0],
        lesson: e[1],
        hanViet: e[2],
        kanjiGoi: e[3], //question
        pronounce: e[4], //answer
        meaning: e[5]
      }));


      if (partionLesson) {
        let temp2 = [];
        if (partionLesson.trim().includes('*')) {
          temp.map(e => {
            kanjiLessons.add(e.lesson);
            temp2.push(e);
          });
        } else {
          let lessons = partionLesson.replace(' ', '').split(',');
          lessons.map(le => {
            temp.map(te => {
              if (String(le).includes('-')) {
                let [m, n] = le.split('-');
                if (te.lesson >= m && te.lesson <= n) {
                  kanjiLessons.add(te.lesson); temp2.push(te);
                }
              } else {
                if (te.lesson == le) {
                  kanjiLessons.add(te.lesson); temp2.push(te);
                }
              }
            })
          });
        }
        temp = temp2;
      }

      // Array.from(kanjiLessons).map(k => console.log(k));
      // temp.map(e => console.log(e));
      // if (filters) {
      //   Object.keys(filters).map(e => {
      //     temp = temp.filter(t => {
      //       return t[e] === filters[e];
      //     });
      //   });
      // }

      if (isGenerate) {
        let generated = [];
        Array.from(kanjiLessons).map(kl => {
          let kjTemp = [], kjAnsTemp = []; // const of this session

          temp.map(t => {
            if (t.lesson == kl) {
              kjTemp.push(t);
              kjAnsTemp.push(t.pronounce);
            };
          }); // end temp

          let ansPop = [];

          kjTemp.map(e => {
            let ansTemp_ = kjAnsTemp.filter(a => {
              if (a !== e.pronounce) ansPop.push(a);
            });
            ansTemp_ = _.shuffle(ansTemp_);
            let ansPart = [];

            ansPart.push({ ans: e.pronounce, check: 'TRUE' });
            ansPart.push({ ans: ansPop.pop(), check: 'FALSE' });
            ansPart.push({ ans: ansPop.pop(), check: 'FALSE' });
            ansPart.push({ ans: ansPop.pop(), check: 'FALSE' });

            ansPart = _.shuffle(ansPart);

            generated.push({
              ...e,
              a: ansPart[0].ans,
              aCheck: ansPart[0].check,
              b: ansPart[1].ans,
              bCheck: ansPart[1].check,
              c: ansPart[2].ans,
              cCheck: ansPart[2].check,
              d: ansPart[3].ans,
              dCheck: ansPart[3].check
            })
          }); // end kjTemp
        }); //end kanjiLession
        res.json(generated);
      } else {
        res.json(temp);
      }
    });
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

router.post('/generate', (req, res, next) => {
  let { xlsFile, filters, sheet, isGenerate, partionLesson } = req.body;
  console.log(req.body);
  if (fs.existsSync(`${xlsDir}/${xlsFile}.xlsx`)) {
    readExcelFile(fs.createReadStream(`${xlsDir}/${xlsFile}.xlsx`), { sheet: sheet | 1 }).then(data => {
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

      if (partionLesson) {
        let temp2 = [];
        if (partionLesson.trim().includes('*')) {
          temp2 = temp2.concat(temp);
        } else {
          let lessons = partionLesson.replace(' ', '').split(',');
          lessons.map(le => {
            temp.map(te => {
              if (String(le).includes('-')) {
                let [m, n] = le.split('-');
                if (te.lesson >= m && te.lesson <= n) temp2.push(te);
              } else {
                if (te.lesson == le) temp2.push(te);
              }
            })
          });
        }
        temp = temp2;
      }

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
          if (otherAns.length <= 3) {
            // next();
          } else {
            let tempAns = [];
            tempAns.push(e.name);
            tempAns.push(otherAns.pop().name);
            tempAns.push(otherAns.pop().name);
            tempAns.push(otherAns.pop().name);

            tempAns = _.shuffle(tempAns);

            let j = { ...e };
            j.a = tempAns.pop();
            j.b = tempAns.pop();
            j.c = tempAns.pop();
            j.d = tempAns.pop();
            return j;
          }

        });
        res.json(generated);
      } else {
        res.json(temp);
      }
    });
  } else {
    res.status(404).json({ message: 'File not found' });
  }

});

router.post('/kanjimetadata', (req, res, next) => {
  let { xlsFile, sheet } = req.body;
  if (fs.existsSync(`${xlsDir}/${xlsFile}.xlsx`)) {
    res.status(200).json({ message: 'OK' });
  }
  else res.status(404).json({ message: 'File not found' })
});

router.post('/metadata', (req, res, next) => {
  let { xlsFile, sheet } = req.body;
  if (fs.existsSync(`${xlsDir}/${xlsFile}.xlsx`)) {
    readExcelFile(fs.createReadStream(`${xlsDir}/${xlsFile}.xlsx`), { sheet: sheet | 1 }).then(data => {
      data.splice(0, 1);
      let lesson = new Set();
      let tl = new Set();
      let category = new Set();

      data.map(e => {
        if (e[1]) lesson.add(e[1]);
        if (e[3]) tl.add(e[3]);
        if (e[4]) category.add(e[4]);
      });

      let opts = {
        lesson: Array.from(lesson),
        tl: Array.from(tl),
        category: Array.from(category)
      };

      res.status(200).json(opts);
    })
  } else { res.status(404).json({ message: 'File not found' }); };
});

module.exports = router;
