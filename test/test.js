const fs = require('fs');
const should = require('should');
const File = require('vinyl');
const HtmlDiffer = require('html-differ').HtmlDiffer;
const logger = require('html-differ/lib/logger');
const { bustCache } = require('../index');

function diffHTMLs(expected, actual) {
  const htmlDiffer = new HtmlDiffer();
  const diff = htmlDiffer.diffHtml(expected, actual);
  return logger.getDiffText(diff, { charsAroundDiff: 40 });
}

function genFile(fullpath) {
  return new File({
    path: fullpath,
    contents: fs.readFileSync(fullpath),
  });
}

function cachesShouldbeBusted(done, beforeFile, expectedFile, options) {
  let newFileContent = null;

  const stream = bustCache(options);

  stream.on('data', function (newFile) {
    newFileContent = newFile.contents;
  });
  stream.on('end', function () {
    const diffText = diffHTMLs(String(expectedFile.contents), String(newFileContent));
    done(diffText);
  });
  stream.on('error', function (err) {
    should.exist(err);
    done(err);
  });

  stream.write(beforeFile);
  stream.end();
}

describe('gulp-asset-bust-cache', function () {
  describe('in buffer mode', function () {
    const expectedFile = genFile('test/data/expected.html');

    it('should add hashes to assets', function (done) {
      const beforeFile = genFile('test/data/before.html');
      cachesShouldbeBusted(done, beforeFile, expectedFile);
    });
  });

  describe('duplicate elements ', function () {
    const expectedFile = genFile('test/data/duplicate_element_expected.html');

    it('should both be cache busted', function (done) {
      const beforeFile = genFile('test/data/duplicate_element_before.html');
      cachesShouldbeBusted(done, beforeFile, expectedFile);
    });
  });

  describe('query name ', function () {
    const expectedFile = genFile('test/data/query_name_expected.html');

    it('should be respected', function (done) {
      const beforeFile = genFile('test/data/query_name_before.html');
      cachesShouldbeBusted(done, beforeFile, expectedFile, { paramName: 'cb' });
    });
  });

  describe('When selector:attribute is specified ', function () {
    const expectedFile = genFile('test/data/attribute_mapping_expected.html');

    it('should replace only the specified ones', function (done) {
      const beforeFile = genFile('test/data/attribute_mapping_before.html');
      cachesShouldbeBusted(done, beforeFile, expectedFile,
                           {
                               selectorMap: {
                                   'script[src]': 'src',
                               },
                           });
    });
  });
});
