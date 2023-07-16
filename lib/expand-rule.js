"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expandRule = expandRule;
exports.isExpandable = isExpandable;
var _parsely = require("./parsely.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function expandRule(rule, term) {
  var _expandSymbols = expandSymbols(rule.symbols, term),
    symbols = _expandSymbols.symbols,
    mapping = _expandSymbols.mapping;
  var postprocess = rule.postprocess ? generatePostprocessSpecialized(rule.postprocess, term, mapping) : null;
  return new _parsely.Rule(rule.name + '<' + term + '>', symbols, postprocess, rule.description, rule.source, null, rule.pkg, rule.noSuggest);
}
function generatePostprocessSpecialized(fn, specializedFor, mapping) {
  return postprocessSpecialized.bind({
    fn: fn,
    specializedFor: specializedFor,
    mapping: mapping
  });
}

/** postprocess function that calls wrap function and ads $specializedFor property to output object */
function postprocessSpecialized(data, reference, fail) {
  var fn = this.fn,
    specializedFor = this.specializedFor,
    mapping = this.mapping;
  var mappedData = mapping.map(function (pos) {
    return data[pos];
  });
  var ret = fn(mappedData, reference, fail);
  if (ret && _typeof(ret) === 'object') {
    ret.$specializedFor = specializedFor;
  }
  return ret;
}
function expandSymbols(source, s) {
  var symbols = [];
  var mapping = [];
  source.forEach(function (item) {
    if (typeof item !== 'string') {
      mapping.push(symbols.length);
      symbols.push(item);
    } else {
      mapping.push(symbols.length);
      symbols.push(parameterizeType(item, s));
    }
  });
  return {
    symbols: symbols,
    mapping: mapping
  };
}
function parameterizeType(type, parameter) {
  return type.replace(/(.*)<(?:t|T)>([\*\?]*)/, '$1<' + parameter + '>$2');
}

/** Test if the rule can be expanded i.e. it uses symbol expansions */
function isExpandable(rule) {
  for (var i = 0; i < rule.symbols.length; ++i) {
    var symbol = rule.symbols[i];
    if (typeof symbol === 'string' && parameterizeType(symbol, 'dummy') !== symbol) {
      return true;
    }
  }
  return false;
}