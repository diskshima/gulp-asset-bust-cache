const fs = require("fs");
const path = require("path");

const PluginError = require("plugin-error");
const map = require("map-stream");
const cheerio = require("cheerio");
const MD5 = require("md5");

const { src, dest } = require("gulp");

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

const addMD5 = function (content, origValue, options) {
  const valNoHash = origValue.split("?")[0];
  const hash = MD5(fs.readFileSync(options.basePath + valNoHash).toString());
  return content.replace(origValue, valNoHash + "?v=" + hash);
};

const bust = function(fileContents, options) {
  const dom = cheerio.load(fileContents);

  options = {
    basePath : options.basePath || "",
  };

  const hasProtocol = /^(http(s)?)|\/\//;
  const elements = dom("script[src], link[rel=stylesheet][href], link[rel=import][href], link[rel=preload][href], source, img");

  for (var i = 0, len = elements.length; i < len; i++) {
    const origValue = loadAttribute(elements[i]);

    if (!hasProtocol.test(origValue)) {
      fileContents = addMD5(fileContents, origValue, options);
    }
  }

  return fileContents;
};

export const bustCache = function (options) {
  if (!options) {
    options = {};
  }

  return map(function (file, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError("bust-cache", "Streaming not supported"));
    }

    if (!options.basePath) {
      options.basePath = path.dirname(path.resolve(file.path))+"/";
    }

    if (options.showLog) {
      console.log("Processing: ", file.path);
    }

    fs.readFile(file.path, { encoding: "UTF-8" }, function (err, data) {
      if (err) {
        return cb(new PluginError("bust-cache", err));
      }

      const processedContents = bust(data, options);

      if (options.showLog) {
        console.log("Cache busted:", file.relative);
      }

      file.contents = new Buffer(processedContents);

      cb(null, file);
    });
  });
};
