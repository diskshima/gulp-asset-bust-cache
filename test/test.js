const fs = require('fs');
const path = require('path');
const should = require('should');
const File = require('vinyl');
const { bustCache } = require('../index');

describe('gulp-bust-cache', function () {
  describe('in buffer mode', function () {
    const expectedFile = new File({
      cwd: 'test/',
      base: 'test/data/',
      path: 'test/data/after.html',
      contents: fs.readFileSync('test/data/after.html'),
    });

    it('should add hashes to assets', function (done) {
      const beforeFile = new File({
        cwd: 'test/',
        base: 'test/data/',
        path: 'test/data/before.html',
        contents: fs.readFileSync('test/data/before.html'),
      });

      let newFileContent = null;

      const stream = bustCache();

      stream.on('data', function (newFile) {
        newFileContent = newFile.contents;
      });
      stream.on('end', function () {
        String(newFileContent).should.equal(String(expectedFile.contents));
        done();
      });
      stream.on('error', function(err) {
        should.exist(err);
        done(err);
      });

      stream.write(beforeFile);
      stream.end();
    });

  });
});


