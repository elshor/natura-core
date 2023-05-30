"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contextEntries = contextEntries;
exports.contextSearch = contextSearch;
exports.locate = locate;
exports.locationContext = locationContext;
var _error = require("./error.js");
var _template = require("./template.js");
var _type = _interopRequireDefault(require("./type.js"));
var _location4 = require("./location.js");
var _spec = require("./spec.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); } /*
                                                                                                                                                                                                                                                                                                                                                  *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                  *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                  */
/**
 * @name ContextEntry
 * @param {String} type
 * @param {String} name
 * @param {String} path the path identifying the reference. This can be used to ensure a reference does not appear twice in the suggestions or to prevent a self suggestions where the path is equal to the suggestion location
 * @param {*} value
 * @param {String} description
 */
/**
 * a context iterator is passed to context search functions. It is called for each context entry that matches the search
 * @callback contextIterator
 * @param {ContextEntry} entry the context entry to return
 * @param {*} value value of the entity
 * @returns {booldean} return false if the search should stop
 */
/**
 * Search for entities within the location context
 * @param {Location} location
 * @param {contextIterator} iterator
 * @param {String} type type to search for or null for any type
 * @param {String} name name to search for or null for any name
 * @param {String} scope the current scope. Each time a use scope is followed, the new scope is added to the scope with a preceding > symbol
 * @param {Boolean} useExpected use expectedSpec instead of spec. This should be used for the first entry when looking for suggestions because we are looking for replacements to current value - we don't want to take current value into account
 */
function contextSearch(location, iterator, type, name) {
  var scope = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
  var visitIt = arguments.length > 5 ? arguments[5] : undefined;
  var useExpected = arguments.length > 6 ? arguments[6] : undefined;
  var current = useExpected ? (0, _location4.shadowLocation)(location) : location;
  var cont = true;
  while (current && cont !== false) {
    cont = visit(current, iterator, type, name, scope, visitIt);
    current = previousContextLocation(current);
  }
}

/**
 * Visit a location in search for context entries. This function searches context entries in the location spec and property spec (the value in spec.properties). It also searches current scope
 * @param {Location} location location to visit
 * @param {contextIterator} iterator 
 * @param {String} type type to search for
 * @param {String} name name to search for
 * @param {String} scope current scope. the reference access will be a join of scope and current access
 * @param {Function} visitIt a callback function used mostly for debug purposes
 */
function visit(location, iterator, type, name, scope, visitIt) {
  if (!location) {
    return true;
  }
  //if useExpected, we are at the fist entry that we want to change. We need to ignore this entry (we want to remove it)
  var referenced = location.referenced;
  if (alreadyVisited(scope, location, iterator)) {
    return true;
  }
  visitIt ? visitIt('location', referenced) : null;
  var currentSpec = referenced.spec;

  //iterate context
  var entries = currentSpec.context || [];
  for (var i = 0; i < entries.length; ++i) {
    var b = visitEntry(referenced, entries[i], iterator, type, name, scope, visitIt);
    if (b === false) {
      return false; //end search
    }
  }

  return true; //continue
}

function visitEntry(referenced, entry, iterator, type, name) {
  var scope = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
  var visitIt = arguments.length > 6 ? arguments[6] : undefined;
  if (!entry || _typeof(entry) !== 'object') {
    return true;
  }
  visitIt ? visitIt('context', referenced, entry) : null;
  switch (entry.$type) {
    case 'basic emit':
      return basicEmit(referenced, entry, iterator, type, name, scope);
    case 'emit value':
      return emitValue(referenced, entry, iterator, type, name, scope);
    case 'emit entity':
      return emitEntity(referenced, entry, iterator, type, name, scope);
    case 'use scope':
      return useScope(referenced, entry, iterator, type, name, scope, null, visitIt);
    case 'use context':
      return useContext(referenced, entry, iterator, type, name, scope, visitIt);
    default:
      (0, _error.assume)(false, 'In context array, got unknown context entry type', entry.$type);
  }
}
function visitScopeEntry(referenced, entry, iterator, type, name) {
  var scope = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
  var scopeName = arguments.length > 6 ? arguments[6] : undefined;
  var visitIt = arguments.length > 7 ? arguments[7] : undefined;
  scope = scope || '';
  if (!entry || _typeof(entry) !== 'object') {
    return true;
  }
  visitIt ? visitIt('scope', referenced, entry) : null;
  return scopeEntry(referenced, entry, iterator, type, name, scope, scopeName, visitIt);
}

/**
 * 
 * @param {String} entry.path
 * @param {String} entry.type
 * @param {String} entry.name
 * @param {String} entry.access
 * @param {String} entry.key
 * @returns 
 */
function scopeEntry(referenced, entry, iterator, type, name, scope, scopeName, visitIt) {
  if (!scope) {
    scope = '';
  }
  var locations = (0, _location4.relativeLocations)(referenced, entry.path || '');
  for (var i = 0; i < locations.length; ++i) {
    var _location = locations[i];
    if (entry.$type === 'scope mixin') {
      return scopeSearch(_location, entry.key, iterator, type, name, scope, scopeName, visitIt);
    }

    //calculate the type
    var entryType = typeof entry.type === 'string' ? (0, _type["default"])((0, _template.calcTemplate)(entry.type, _location.contextNoSearch), _location).toString() : (0, _type["default"])(entry.type, _location);
    var spec = _location.dictionary.getTypeSpec(entryType);

    //calculate emit name
    var emitProperty = entry.name ? (0, _template.calcTemplate)(entry.name, locationContext(_location, {
      scopeName: scopeName
    })) : _location.lang.theType((0, _spec.specContextType)(spec));
    if (!emitProperty || emitProperty.length === 0) {
      //if entry does not have a calculated name then do not emit it
      continue;
    }
    var entryAccess = entry.access ? (0, _template.calcTemplate)(entry.access, _location.contextNoSearch) : null;
    var emitName = emitProperty;
    var description = (0, _template.calcTemplate)(entry.description || '', _location.contextNoSearch);
    if (match(referenced.dictionary, iterator, type, name, entryType, emitName, {
      $type: 'reference',
      label: emitName,
      valueType: entryType,
      access: entryAccess ? scope + (entryAccess === 'this' ? '' : "." + (entryAccess || emitName)) : undefined,
      role: entry.role || 'artifact',
      path: _location.path,
      description: description
    }, description, _location.path) === false) {
      return false;
    }
  }
  return true;
}

/** emit an entity in the document. This emit references an existing a location in the document from another location */
function emitEntity(location, entry, iterator, type, name) {
  var scope = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
  var visitIt = arguments.length > 6 ? arguments[6] : undefined;
  var emitName = entry.name ? (0, _template.calcTemplate)(entry.name, location.contextNoSearch, true) : location.value ? location.value.name : undefined;
  var emitType = location.type;
  if (!emitName) {
    //if there is no name defiend then cannot emit it
    return true;
  }
  if (match(location.dictionary, iterator, type, name, emitType, emitName, {
    $type: 'reference',
    label: emitName,
    valueType: emitType,
    path: location.path,
    role: entry.role || 'artifact'
  }, entry.description, location.path) === false) {
    return false;
  } else {
    return true;
  }
}
/**
 * 
 * @param {Location} original 
 * @param {String} entry.path 
 * @param {String} entry.scope
 * @param {String} entry.type
 * @param {String} entry.name
 * @param {String} entry.access the code name used to access the context entity. If empty then this entry is ignored
 * @param {String} entry.description
 * @param {*} iterator 
 * @param {*} type 
 * @param {*} name 
 * @param {*} scope 
 * @param {*} visitIt 
 * @returns 
 */
function basicEmit(original, entry, iterator, type, name) {
  var scope = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
  var locations = (0, _location4.relativeLocations)(original, entry.path || '');
  scope = entry.scope ? scope + entry.scope + '.' : scope;
  var _loop = function _loop() {
    var referenced = locations[i].referenced;

    //calculate the type
    var entryType;
    if (typeof entry.type === 'string') {
      entryType = (0, _template.calcTemplate)(entry.type, referenced.contextNoSearch);
      if (!entryType) {
        //the calculation failed - do not emit
        return "continue";
      }
    } else if (_typeof(entry.type) === 'object') {
      //entry.type is a type object
      entryType = (0, _type["default"])(entry.type, referenced).toString();
    } else {
      entryType = location.type;
    }

    //calculate emit name
    var emitName = entry.name ? (0, _template.calcTemplate)(entry.name, referenced.contextNoSearch) : function (type) {
      var spec = referenced.dictionary.getTypeSpec(type);
      return referenced.lang.theType((0, _spec.specContextType)(spec));
    }(entryType);
    if (emitName === '') {
      //emit name is empty - disregard this entry - cannot display it
      return "continue";
    }

    //calculate access
    var access = (0, _template.calcTemplate)(entry.access || entry.name, referenced.contextNoSearch);
    if (access === '') {
      //access is empty - this means we need to disregard this entry
      return "continue";
    }
    if (match(referenced.dictionary, iterator, type, name, entryType, emitName, {
      $type: 'reference',
      label: emitName,
      valueType: entryType,
      access: scope ? scope + access : access,
      path: referenced.path,
      role: entry.role || 'artifact'
    }, entry.description, referenced.path) === false) {
      return {
        v: false
      };
    }
  };
  for (var i = 0; i < locations.length; ++i) {
    var _ret = _loop();
    if (_ret === "continue") continue;
    if (_typeof(_ret) === "object") return _ret.v;
  }
  return true;
}
function emitValue(original, entry, iterator, type, name) {
  var scope = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
  var visitIt = arguments.length > 6 ? arguments[6] : undefined;
  var location = original.referenced;
  var context = location.referenced.contextNoSearch;
  var emitType = (0, _template.calcTemplate)(entry.type, context); //TODO handle object types that cannot be described as text
  var emitName = (0, _template.calcTemplate)(entry.name, context);
  if (!emitName || emitName.length === 0 || !emitType || emitType.length === 0) {
    //if name or type are empty then don't emit
    return true;
  }
  var value = (0, _template.calcTemplate)(entry.value, context);
  var description = (0, _template.calcTemplate)(entry.description, context);
  if (match(location.dictionary, iterator, type, name, emitType, emitName, {
    $type: 'reference',
    label: emitName,
    valueType: emitType,
    value: value,
    description: description,
    role: entry.role || 'artifact'
  }, description, location.path) === false) {
    return false;
  }
  return true;
}

/**
 * 
 * @param {Location} location location to search its scope
 * @param {String} scopeType 
 * @param {contextIterator} iterator 
 * @param {String} type type to search for
 * @param {String} name name to search for
 * @param {String} scope current scope
 * @param {*} scopeName 
 * @param {*} visitIt 
 * @returns 
 */
function scopeSearch(location, key, iterator, type, name, scope, scopeName, visitIt) {
  var currentSpec = location.spec;
  visitIt ? visitIt('scope-search', location, {
    key: key
  }) : null;
  var entries = currentSpec.scope ? currentSpec.scope[key] || [] : [];
  for (var i = 0; i < entries.length; ++i) {
    var b = visitScopeEntry(location, entries[i], iterator, type, name, scope, scopeName, visitIt);
    if (b === false) {
      return false; //end search
    }
  }

  return true; //continue search
}

/**
 * use the context of a property. It goes over context entries of property spec
 * @param {Location} referenced
 * @param {String} entry.path
 * @param {String} entry.scope
 */
function useContext(referenced, entry, iterator, type, name, scope, visitIt) {
  scope = scope || '';
  var locations = (0, _location4.relativeLocations)(referenced, entry.path);
  var entryScope = entry.scope ? (0, _template.calcTemplate)(entry.scope, referenced.contextNoSearch) : '';
  return iterateArray(locations, iterator, type, name, entryScope ? scope + (entryScope || '') + '.' : scope, visitIt);
}
function useScope(referenced, entry, iterator, type, name, scope, scopeName, visitIt) {
  scopeName = entry.scopeName ? (0, _template.calcTemplate)(entry.scopeName, referenced.contextNoSearch) : scopeName;
  var locations = (0, _location4.relativeLocations)(referenced, entry.path);
  for (var i = 0; i < locations.length; ++i) {
    var _location2 = locations[i];
    var entryAccess = entry.access ? (0, _template.calcTemplate)(entry.access, _location2.contextNoSearch) : null;
    scope = entryAccess ? scope + '.' + entryAccess : scope;
    if (scopeSearch(_location2, entry.key, iterator, type, name, scope, scopeName, visitIt) === false) {
      return false;
    }
    ;
  }
  return true; //continue search
}

/**
 * Find the location to be visited before current location when evaluating context. The order in which context is evaluated determines
 * @param {Location} location current location
 * @returns {Location}
 */
function previousContextLocation(location) {
  if (!location) {
    return null;
  }
  var parent = location.parent;
  var emitOrder = parent ? parent.spec.emitOrder || [] : null;
  if (Array.isArray(emitOrder) && !(0, _type["default"])(parent.spec.type, parent).isCollection) {
    //we have emitOrder defined. Check where we are and move to previous location
    var pos = emitOrder.indexOf(location.property);
    if (pos > 0) {
      return location.sibling(emitOrder[pos - 1]);
    }
  }
  return null;
}
function match(dictionary, it, queryType, queryName, type, name, value, description, path) {
  function searchString(type) {
    return type.searchString || type.toString();
  }
  var matchType = !queryType || dictionary.isa(searchString(type), searchString(queryType));
  var matchName = !queryName || queryName === name;
  if (matchType && matchName) {
    return it({
      type: type,
      name: name,
      value: value,
      description: description,
      path: path
    });
  } else {
    return true;
  }
}
function contextEntries(location, type, name, useExpected) {
  var values = {};
  contextSearch(location, function (entry) {
    var id = entry && _typeof(entry.value) === 'object' ? entry.value.path || entry.name : entry.value;
    if (!values[id]) {
      values[id] = entry;
    }
    return true;
  }, type, name, null,
  //scope
  null,
  //visitIt
  useExpected);
  return Object.values(values);
}
function locate(location, type, name) {
  var value;
  contextSearch(location, function (entry) {
    value = entry.value;
  }, type, name);
  return value;
}

/**
 * Create a context object that encapsulates all entities in the location context. The return value is a proxy. When getting a property the following search is executed
 * <br>if property is $location then return the location
 * <br>if property is $dictionary then return the dictionary of current location
 * <br>if property is $isProxy then return true
 * <br>if property is $value then calculate the value of current location. If the location is a reference then dereference it first
 * <br>if value of current location has the search property then return it
 * <br>search the context for an entity with name equal to the property
 * <br>
 * if `contextLocation` is specified then use its context for context search rather than searching the location context. This might be usefull for example after deleting an entity where we want to use its parent context search.
 * @param {Location} location current location
 * @param  {Location|Object} contextLocation optional location to use for context search. If the value is a non-location object then treat it as object context where if the get property is equal to a property in the context object then return it. Default is location
 * @returns Object
 */
function locationContext(location) {
  var contextLocation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : location;
  return new Proxy(location, {
    get: function get(location, prop) {
      if (typeof prop !== 'string') {
        //only string properties are supported
        return undefined;
      }
      if (prop === '$') {
        //$ just returns itself. This is done so we can start any path with $. (used in natura-pkg)
        return locationContext(location, contextLocation);
      }
      if (prop === '$location') {
        return location;
      }
      if (prop === '$dictionary') {
        return location.dictionary;
      }
      if (prop === '$value') {
        //return the value of current location (dereferenced)
        return location.referenced.value;
      }
      if (prop === '$parent') {
        return locationContext(location.parent, contextLocation);
      }
      if (prop === '$spec') {
        return (0, _spec.Spec)(location.spec);
      }
      if (prop === '$valueType') {
        var spec = location.spec;
        return (0, _type["default"])(spec.valueType || location.type, location);
      }
      if (prop === '$valueTypeSpec') {
        return location.valueTypeSpec;
      }
      if (prop === '$type') {
        return location.type;
      }
      if (prop === '$isProxy') {
        //this property signals that we can use $value
        return true;
      }

      //check if location value has the property
      var propLocation = location.referenced.child(prop);
      var value = propLocation.value;
      if (value && _typeof(value) === 'object') {
        //if this is a value reference then return the value
        if (value.$type === 'reference' && value.value) {
          return value.value;
        }
        //this is an object - return a new context
        return locationContext(propLocation, contextLocation);
      } else if (typeof value !== 'undefined') {
        //this is a non-object - return the raw value
        return value;
      }

      //search context
      if (contextLocation.isLocation) {
        var found;
        contextSearch(contextLocation, function (_ref) {
          var type = _ref.type,
            name = _ref.name,
            value = _ref.value;
          found = value;
          return false;
        }, null, prop);
        //wrap result in location object so we get dereference and other location features
        return (0, _location4.createLocation)(found, location.dictionary).entity;
      } else {
        if (prop in contextLocation) {
          return contextLocation[prop];
        }
      }
    }
  });
}
function iterateArray(locations, iterator, type, name, scope, visitIt) {
  var _iterator = _createForOfIteratorHelper(locations),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _location3 = _step.value;
      var b = visit(_location3, iterator, type, name, scope, visitIt);
      if (b === false) {
        return false;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return true;
}
function alreadyVisited(scope, location, iterator) {
  //we need to specify scope so we always visit a location with the correct scope
  var key = "".concat(scope, "|").concat(location.path);
  if (!iterator.state) {
    iterator.state = IteratorState();
  }
  if (iterator.state.visited.has(key)) {
    return true;
  } else {
    iterator.state.visited.add(key);
    return false;
  }
}
function IteratorState() {
  return {
    visited: new Set()
  };
}