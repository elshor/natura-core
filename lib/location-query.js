"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = locationQuery;
var _location = require("./location.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function locationQuery(location, path) {
  if (path[0] === '/') {
    //the location is relative to top
    location = (0, _location.createLocation)(location.data, location.dictionary);
  }
  var current = [location];
  var parts = path.split('/');
  parts.forEach(function (part) {
    var now = [];
    current.forEach(function (l) {
      return follow(l, part, now, location.dictionary);
    });
    current = now;
  });
  return current;
}
function follow(location, part, current, dictionary) {
  //TODO add other meta properties such as spec etc.
  if (!location) {
    return;
  }
  if (!location.isLocation) {
    //current object is not a location - wrap it in a location
    location = (0, _location.createLocation)(location, dictionary);
  } else {
    location = location.referenced;
  }
  switch (part) {
    case '':
    case '.':
    case '$':
      current.push(location);
      return;
    case '..':
      current.push(location.parent);
      return;
    case '*':
      current.push.apply(current, _toConsumableArray(location.children));
      return;
    case '**':
      current.push.apply(current, _toConsumableArray(allChildren(location)));
      return;
    case '$previous':
      current.push(location.previous);
      return;
    case '$valueTypeSpec':
      current.push((0, _location.createLocation)(location.valueTypeSpec, dictionary));
      return;
  }
  //check if this is a filter
  var query = part.match(/^\?(isa)\W+(.*)$/);
  if (query) {
    //we are in a query - if pass then add current location
    var test = query[1];
    var arg = query[2];
    switch (test) {
      case 'isa':
        if (location.dictionary.isa(location.type, arg)) {
          current.push(location);
        }
        break;
      default:
        //unidentified test
        console.error('location query using unknown test', test, '- failing the test');
    }
  } else {
    current.push(location.child(part));
  }
}
function allChildren(location) {
  var ret = [];
  function visitChildren(location) {
    location.children.forEach(function (child) {
      ret.push(child);
      visitChildren(child);
    });
  }
  visitChildren(location);
  return ret;
}