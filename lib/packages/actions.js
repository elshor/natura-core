"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _ref;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
var _default = [{
  pattern: 'if <<condition>> then <<action>> otherwise <<alternateAction>>',
  name: 'condition statement',
  suggest: {
    tag: 'core'
  },
  description: 'Test if a condition is true. If it is true then execution action. Otherwise eecute the alternate action if exists.',
  title: 'condition statement',
  isa: ['action'],
  role: 'type',
  valueType: 'action',
  properties: {
    'condition': {
      type: 'condition'
    },
    'action': {
      type: 'action',
      placeholder: 'action to perform',
      description: "Specify here the action to perform when the condition is true."
    },
    'alternateAction': {
      type: 'action',
      placeholder: 'action if condition is false',
      title: 'otherwise'
    }
  }
}, (_ref = {
  name: 'action sequence to perform',
  displayPattern: 'do the following actions',
  suggest: {
    tag: 'core'
  },
  expanded: true,
  valueType: 'action',
  role: 'type',
  isa: ['action'],
  show: ['sequence']
}, _defineProperty(_ref, "expanded", true), _defineProperty(_ref, "properties", {
  sequence: {
    type: 'action*',
    expanded: true,
    hideName: true,
    required: true,
    placeholder: 'action to perform',
    description: 'Specify an action to perform. the actions will be executed in order, waiting for previous asynchronous action to complete (such as resource load)'
  }
}), _ref), {
  name: 'lvalue',
  description: 'A generic type for variables that can be set',
  genericProperties: ['type']
}, {
  name: 'set',
  suggest: {
    tag: 'core'
  },
  title: 'set value',
  isa: 'action',
  valueType: 'action',
  role: 'type',
  description: 'set a value of a property or variable',
  pattern: 'set <<lvalue>> to <<value>>',
  properties: {
    lvalue: {
      type: 'lvalue',
      placeholder: 'property or variable to set'
    },
    value: {
      placeholder: 'value to set',
      type: function type(_ref2) {
        var $location = _ref2.$location;
        var prop = $location.sibling('lvalue');
        if (!prop || !prop.value) {
          //property not set, return any
          return 'any instance';
        }
        var valueType = prop.spec.$specialized.type;
        return valueType || 'any instance';
      }
    }
  }
}, {
  name: 'repeat for each',
  pattern: 'for each item in <<collection>> do <<actions>>',
  suggest: {
    tag: 'core'
  },
  description: 'Repeat a sequence of actions for each item in a collection. The current item can be referenced from the action script as "the item"',
  role: 'type',
  isa: ['action'],
  valueType: 'action',
  title: 'repeat for each',
  context: [{
    $type: 'basic emit',
    type: {
      $type: 'copy type',
      path: '$location.properties.collection.valueSpec.$specialized.dataType'
    },
    name: '{{the $location.properties.collection.valueSpec.$specialized.dataType}}',
    access: '{{$id}}-item',
    useScope: false,
    description: 'the current item'
  }],
  properties: {
    collection: {
      type: 'data collection',
      placeholder: 'collection of items',
      description: 'Select a collection of items you would like to repeat the action for'
    },
    actions: {
      type: 'action*',
      placeholder: 'actions to perform'
    }
  }
}];
exports["default"] = _default;