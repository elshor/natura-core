"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParamValue = exports.MissingParam = exports.LoadError = exports.IllegalType = void 0;
exports.assume = assume;
exports.depracated = depracated;
/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
function assume(condition) {
  if (!condition) {
    var _console;
    for (var _len = arguments.length, message = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      message[_key - 1] = arguments[_key];
    }
    (_console = console).error.apply(_console, ['Assumption Failed:'].concat(message));
    throw new Error('Assumption Failed: ' + message.map(function (item) {
      return item.toString();
    }).join(' '));
  }
}
function depracated() {
  console.error('This code is depracated');
  throw new Error('Depracated');
}
var LoadError = 'load-error';
exports.LoadError = LoadError;
var ParamValue = 'param-value';
exports.ParamValue = ParamValue;
var MissingParam = 'missing-param';
exports.MissingParam = MissingParam;
var IllegalType = 'illegal-type';
exports.IllegalType = IllegalType;