"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = reference;
var _error = require("./error.js");
/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */

function reference(label, valueType, path, description, value) {
  (0, _error.assume)(label, 'label of reference must be specified');
  (0, _error.assume)(valueType, 'value type for reference must be specified');
  return {
    $type: 'reference',
    label: label,
    valueType: valueType,
    path: path,
    description: description,
    value: value
  };
}
;