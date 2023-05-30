"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _actions = _interopRequireDefault(require("./actions.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } /*
                                                                                                                                                                                     *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                     *   All rights reserved.
                                                                                                                                                                                     */
var entities = [{
  name: 'front end script',
  show: ['interactions'],
  properties: {
    interactions: {
      type: 'event handler*',
      expanded: true
    }
  }
}, {
  name: 'wix script',
  show: ['content', 'interactions'],
  properties: {
    content: {
      title: 'content connections',
      type: 'content connection*',
      expanded: true
    },
    interactions: {
      type: 'event handler*',
      expanded: true
    }
  }
}, {
  name: 'content connection',
  pattern: 'connect <<data>> to <<element>>',
  show: ['n', 'mode', 'steps'],
  properties: {
    data: {
      placeholder: 'select collection to connect',
      title: 'number of items',
      type: 'string'
    },
    element: {
      placeholder: 'select repeater to connect',
      type: 'string'
    },
    n: {
      type: 'number',
      placeholder: 'number of items to display',
      title: 'number of items'
    },
    mode: {
      options: ['read only', 'read-write'],
      type: 'string',
      init: 'read only'
    },
    steps: {
      type: 'processing step*',
      placeholder: 'define processing step such as filter or sort',
      expanded: true
    }
  }
}, {
  name: 'processing step',
  placeholder: 'processing step such as filter or sort'
}];
entities.push.apply(entities, _toConsumableArray(_actions["default"]));
var _default = {
  name: 'data store',
  entities: {
    $type: 'entity definition group',
    members: entities,
    model: {
      isa: []
    }
  }
};
exports["default"] = _default;