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

function cachesShouldbeBusted(done, stream, beforeFile, expectedFile) {
  let newFileContent = null;

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
}

describe('gulp-asset-bust-cache', function () {
  describe('in buffer mode', function () {
    const expectedFile = genFile('test/data/expected.html');

    it('should add hashes to assets', function (done) {
      const stream = bustCache();

      const beforeFile = genFile('test/data/before.html');
      cachesShouldbeBusted(done, stream, beforeFile, expectedFile);

      stream.end();
    });

    it('should ignore when missing attributes', function (done) {
      const stream = bustCache();

      const expectedFile = genFile('test/data/missing_attribute_expected.html');

      const beforeFile = genFile('test/data/missing_attribute_before.html');
      cachesShouldbeBusted(done, stream, beforeFile, expectedFile);

      stream.end();
    });
  });

  describe('duplicate elements ', function () {
    const expectedFile = genFile('test/data/duplicate_element_expected.html');

    it('should both be cache busted', function (done) {
      const stream = bustCache();

      const beforeFile = genFile('test/data/duplicate_element_before.html');
      cachesShouldbeBusted(done, stream, beforeFile, expectedFile);

      stream.end();
    });
  });

  describe('query name ', function () {
    const expectedFile = genFile('test/data/query_name_expected.html');

    it('should be respected', function (done) {
      const stream = bustCache({ paramName: 'cb' });

      const beforeFile = genFile('test/data/query_name_before.html');
      cachesShouldbeBusted(done, stream, beforeFile, expectedFile);

      stream.end();
    });
  });

  describe('When selector:attribute is specified ', function () {
    it('should replace only the specified ones', function (done) {
      const stream = bustCache({
        selectorMap: {
          'script[src]': 'src'
        }
      });

      const expectedFile = genFile('test/data/attribute_mapping_expected.html');
      const beforeFile = genFile('test/data/attribute_mapping_before.html');
      cachesShouldbeBusted(done, stream, beforeFile, expectedFile);

      stream.end();
    });
  });

  describe('HTML files with different directories ', function () {
    it('should be properly cache busted', function (done) {
      const stream = bustCache();

      // Not checking the result of this first file as we only want to check
      // the cache busting for the second file.
      const beforeFile = genFile('test/data/before.html');
      stream.write(beforeFile);

      const expectedSubdirFile = genFile('test/data/subdir/expected.html');
      const beforeSubDirFile = genFile('test/data/subdir/before.html');
      cachesShouldbeBusted(done, stream, beforeSubDirFile, expectedSubdirFile);

      stream.end();
    });
  });
});
