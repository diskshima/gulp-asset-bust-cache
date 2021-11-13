const fs = require("fs");
const path = require("path");
const { Buffer } = require("buffer");

const PluginError = require("plugin-error");
const through = require("through2");
const cheerio = require("cheerio");
const MD5 = require("md5");

const PLUGIN_NAME = "bust-cache";

const loadAttribute = function (content) {
  const contentName = content.name.toLowerCase();

  switch (contentName) {
  case "link":
    return content.attribs.href;
  case "script":
  case "img":
    return content.attribs.src;
  case "source":
    return content.attribs.srcset;
  }

  throw "No matching attribute for this tag: " + contentName;
};

const setAttibute = function (elm, newValue) {
  const contentName = elm.name.toLowerCase();

  switch (contentName) {
  case "link":
    elm.attribs.href = newValue;
    break;
  case "script":
  case "img":
    elm.attribs.src = newValue;
    break;
  case "source":
    elm.attribs.srcset = newValue;
    break;
  }
};

const addMD5Param = function (origValue, options) {
  const valNoHash = origValue.split("?")[0];
  const hash = MD5(fs.readFileSync(options.basePath + valNoHash).toString());
  return valNoHash + "?v=" + hash;
}

const bust = function(fileContents, options) {
  const dom = cheerio.load(fileContents);

  options = {
    basePath : options.basePath || "",
  };

  const hasProtocol = /^(http(s)?)|\/\//;
  const elements = dom("script[src], link[rel=stylesheet][href], link[rel=import][href], link[rel=preload][href], source, img");

  for (var i = 0, len = elements.length; i < len; i++) {
    const elm = elements[i];
    const origValue = loadAttribute(elm);

    if (!hasProtocol.test(origValue)) {
      const newValue = addMD5Param(origValue, options);
      setAttibute(elm, newValue);
    }
  }

  return dom.html();
};

const bustCache = function (options) {
  if (!options) {
    options = {};
  }

  const stream = through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    if (file.isBuffer()) {
      if (!options.basePath) {
        options.basePath = path.dirname(path.resolve(file.path)) + "/";
      }

      if (options.showLog) {
        console.log("Processing: ", file.path);
      }

      const processedContents = bust(file.contents.toString(enc), options);

      file.contents = Buffer.from(processedContents);
    }

    this.push(file);

    cb();
  });

  return stream;
};

exports.bustCache = bustCache;
