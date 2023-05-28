"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = parseText;
var _parsely = require("./parsely.js");
var CACHE = [];
var CACHE_SIZE = 10;

/**
 * Parse a text using the grammer. Cache old parsers for reuse. If parsing receives an exception then return the parser at its state
 * @param {String} text 
 * @param {Grammer} grammer 
 */
function parseText(text, grammer) {
  //create parser
  var parser = new _parsely.Parser(grammer, null, {
    keepHistory: false
  });
  var fullText = text;
  //search cache for state
  for (var i = CACHE.length - 1; i >= 0; --i) {
    if (text.startsWith(CACHE[i].text)) {
      //use this state - assume the longest state is pushed last
      parser.restore(CACHE[i].column);
      text = text.substring(CACHE[i].text.length);
      break;
    }
  }
  try {
    parser.feed(text);
  } catch (e) {
    //throw the regular exception + parser at current state
    throw Object.assign(e, {
      parser: parser
    });
  }
  CACHE.push({
    text: fullText,
    column: parser.save()
  });
  if (CACHE.length > CACHE_SIZE) {
    CACHE.shift();
  }
  return parser;
}