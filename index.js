const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

const PluginError = require('plugin-error');
const through = require('through2');
const cheerio = require('cheerio');
const MD5 = require('md5');

const PLUGIN_NAME = 'bust-cache';
const DEFAULT_PARAM_NAME = 'v';
const DEFAULT_SELECTOR_MAP = {
    'script': 'src',
    'link[rel=stylesheet]': 'href',
    'link[rel=import]': 'href',
    'link[rel=preload]': 'href',
    'source': 'srcset',
    'img': 'src',
};

function addMD5Param(origValue, options) {
  const valNoHash = origValue.split('?')[0];
  const hash = MD5(fs.readFileSync(options.basePath + valNoHash).toString());
  const paramName = options.paramName || DEFAULT_PARAM_NAME;

  return valNoHash + '?' + paramName + '=' + hash;
}

function runBust(file, enc, options) {
  const tmpOptions = {
    basePath : options.basePath || path.dirname(path.resolve(file.path)) + "/",
    ...options,
  };

  const fileContents = file.contents.toString(enc)

  const dom = cheerio.load(fileContents);

  const hasProtocol = /^(http(s)?)|\/\//;

  const map = tmpOptions.selectorMap || DEFAULT_SELECTOR_MAP;

  Object.keys(map).forEach(function (key) {
    const elements = dom(key);
    const attrName = map[key];

    for (var j = 0; j < elements.length; j++) {
      const elm = elements[j];
      const origValue = elm.attribs[attrName];

      if (origValue && !hasProtocol.test(origValue)) {
        const newValue = addMD5Param(origValue, tmpOptions);
        elm.attribs[attrName] = newValue;
      }
    }
  });

  return dom.html();
}

function bustCache (options) {
  if (!options) {
    options = {};
  }

  const stream = through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    if (file.isBuffer()) {
      if (options.showLog) {
        console.log('Processing: ', file.path);
      }

      const processedContents = runBust(file, enc, options);

      file.contents = Buffer.from(processedContents);
    }

    this.push(file);

    cb();
  });

  return stream;
}

exports.bustCache = bustCache;
