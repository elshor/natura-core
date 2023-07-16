"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changeListener = changeListener;
exports["default"] = void 0;
exports.getDictionary = getDictionary;
var _error = require("./error.js");
var _spec = require("./spec.js");
var _pattern = require("./pattern.js");
var _type = _interopRequireDefault(require("./type.js"));
var _entity = require("./entity.js");
var _deepmerge = _interopRequireDefault(require("deepmerge"));
var _base = _interopRequireDefault(require("./packages/base.js"));
var _reference = _interopRequireDefault(require("./reference.js"));
var _template = require("./template.js");
var _role = require("./role.js");
var _parser = require("./parser.js");
var _suggest = require("./suggest.js");
var _loader = require("./loader.js");
var _registerPackage = _interopRequireDefault(require("./register-package.js"));
var _logger = _interopRequireDefault(require("./logger.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                                                               *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                               */
var Dictionary = /*#__PURE__*/function () {
  function Dictionary() {
    var packages = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [_base["default"]];
    var logger = arguments.length > 1 ? arguments[1] : undefined;
    _classCallCheck(this, Dictionary);
    (0, _error.assume)((0, _entity.entityIsArray)(packages), 'packages should be an array. It is ' + JSON.stringify(packages));
    this.packages = packages;
    this.logger = logger || new _logger["default"](console, 'error');
    this.reset();
    this.resetVersion();
  }
  _createClass(Dictionary, [{
    key: "error",
    value: function error() {
      var _this$logger;
      (_this$logger = this.logger).error.apply(_this$logger, arguments);
    }
  }, {
    key: "reset",
    value: function reset() {
      //clear old data
      this.initiated = true;
      this.repo = {};
      this.isaRepo = {};
      this.valueTypeRepo = {};
      this.collectionRepo = [];
      this.instances = {};
      this.instancesByType = {};
      this.functions = {};
      this.parser = new _parser.Parser(this);

      //initialization registerations
      this._registerType('entity definition group', {
        isa: ['definition group']
      });
      this._registerIsa('definition group', 'entity definition group');
      this._registerIsa('definition group', 'property definition group');
      this._registerIsa('definition group', 'event definition group');
      this._registerIsa('definition group', 'expression definition group');
      this._registerIsa('definition group', 'action definition group');
    }
  }, {
    key: "isInitiated",
    value: function isInitiated() {
      return this.initiated === true;
    }
  }, {
    key: "isTypeGeneric",
    value: function isTypeGeneric(type) {
      var spec = this.getTypeSpec(type);
      return (0, _spec.isSpecGeneric)(spec);
    }
  }, {
    key: "isa",
    value: function isa(type, className) {
      if (className.isa) {
        return className.isa(this, type);
      }
      type = searchString(type);
      className = searchString(className);
      if (type === className) {
        //a class is always itself - e.g. an action is an action
        return true;
      }
      if (!type) {
        return false;
      }
      if (className === 'any') {
        return true;
      }
      if (type === '?') {
        return true;
      }
      this._ensureSpecializedIsRegistered(type);
      if ((this.isaRepo[className] || []).includes(type)) {
        return true;
      }
      var _getSpecializedType = getSpecializedType(type),
        specialized = _getSpecializedType.specialized,
        generic = _getSpecializedType.generic;
      if (!generic) {
        return false;
      }

      //check generics
      if (generic === className.toString()) {
        //class includes all specializations of generic
        return true;
      }
      var specializedClass = getSpecializedType(className);
      if (generic === specializedClass.generic) {
        //class and type are both specializations of generic
        //NOTE we reverse here className and type looking for
        //className.specialized isa type.specialized
        return this.isa(specializedClass.specialized, specialized);
      }
      return false;
    }
  }, {
    key: "resetVersion",
    value: function resetVersion() {
      this.version = '' + (Number(new Date()) - new Date('2020-01-01') + Math.random()).toString(36).replace('.', '');
    }

    /**
     * Initial load of packages to the dictionary. This must be called before the dictionary is used
     */
  }, {
    key: "load",
    value: function () {
      var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(dynamicPackages) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.reload(dynamicPackages);
            case 2:
              return _context.abrupt("return", _context.sent);
            case 3:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function load(_x) {
        return _load.apply(this, arguments);
      }
      return load;
    }()
    /**
     * Reload the packages. This should be called when the packages are changed and need to be reprocessed. All packages are reloaded. In addition, dynamicPackages are also loaded
     */
  }, {
    key: "reload",
    value: function () {
      var _reload = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        var _this = this;
        var dynamicPackages,
          packagesToLoad,
          loading,
          loaded,
          _args2 = arguments;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              dynamicPackages = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : [];
              dynamicPackages = (0, _entity.entityIsArray)(dynamicPackages) ? dynamicPackages : [dynamicPackages];
              packagesToLoad = this.packages.concat(dynamicPackages);
              loading = packagesToLoad.map(function (pkg) {
                return _this._loadPackage(pkg);
              });
              _context2.next = 6;
              return Promise.all(loading);
            case 6:
              loaded = _context2.sent;
              this.reset();
              try {
                loaded.forEach(function (pkg) {
                  _this._processPackage(pkg);
                });
              } catch (e) {
                this.error('Exception', e);
              }
              this.parser.endTypes();
              this.resetVersion();
            case 11:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function reload() {
        return _reload.apply(this, arguments);
      }
      return reload;
    }()
  }, {
    key: "parse",
    value: function parse(text, target, verbosity) {
      return this.parser.parse(text, target, new _logger["default"](this.logger, verbosity));
    }
  }, {
    key: "parseWants",
    value: function parseWants(text, target) {
      return this.parser.parseWants(text, target);
    }
  }, {
    key: "getGrammer",
    value: function getGrammer() {
      return this.parser.getGrammer();
    }
  }, {
    key: "suggestCompletion",
    value: function suggestCompletion(text, target, verbosity) {
      return (0, _suggest.suggestCompletion)(this, text, target, new _logger["default"](this.logger || console, verbosity));
    }
  }, {
    key: "suggestTokens",
    value: function suggestTokens(text, target, options, verbosity) {
      return (0, _suggest.suggestTokens)(this, text, target, options, new _logger["default"](this.logger, verbosity));
    }
  }, {
    key: "_dumpParseRules",
    value: function _dumpParseRules(target) {
      this.parser._dumpParseRules(target);
    }
  }, {
    key: "_dumpUsedBy",
    value: function _dumpUsedBy(target) {
      this.parser._dumpUsedBy(target);
    }
  }, {
    key: "setPackages",
    value: function setPackages() {
      var packages = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [_base["default"]];
      this.packages = packages;
    }
  }, {
    key: "getSpec",
    value: function () {
      var _getSpec = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(entity) {
        var type;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              type = entity.$type; //assuming the package is loaded and no need to resolve type
              return _context3.abrupt("return", this.getTypeSpec(type));
            case 2:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      function getSpec(_x2) {
        return _getSpec.apply(this, arguments);
      }
      return getSpec;
    }()
  }, {
    key: "getTypeSpec",
    value: function getTypeSpec(type) {
      if (!type) {
        return {};
      }
      this._ensureSpecializedIsRegistered(type);
      return this.repo[searchString(type)] || {};
    }
    /**
     * returns the singular form of a plural type. E.g. getSingular('element*') should return 'element'
     * @param {String} type the plural type name
     */
  }, {
    key: "getSingular",
    value: function getSingular(type) {
      //currently assuming all collections are notes with ending `*`
      (0, _error.assume)(typeof type === 'string', _error.ParamValue, 'getSingular takes a string parameter');
      if (type.endsWith('*')) {
        return type.substr(0, type.length - 1);
      } else {
        return type;
      }
    }
  }, {
    key: "typeHasSpec",
    value: function typeHasSpec(type) {
      this._ensureSpecializedIsRegistered(type);
      return this.repo[type] !== undefined;
    }

    /**
     * Returns all specs that their `isa` property includes `type`
     * @param {String} type the class type
     */
  }, {
    key: "getClassMembers",
    value: function getClassMembers(type) {
      var _this2 = this;
      if (type.getClassMembers) {
        return type.getClassMembers(this);
      }
      var isaList = this.isaRepo[type.toString()] || [];
      var _getSpecializedType2 = getSpecializedType(type),
        generic = _getSpecializedType2.generic,
        specialized = _getSpecializedType2.specialized;
      if (!generic) {
        return isaList;
      }
      //this is a generic type - generate isa based on specialized type
      var specializedSpec = this.getTypeSpec(specialized);
      var members = Array.from(specializedSpec.isa || []).map(function (t) {
        return _this2.isaRepo["".concat(generic, "<").concat(t, ">")];
      });
      members.push(this.isaRepo["".concat(generic, "<any>")]);
      members.push(isaList);
      return unique(members.flat()).map(function (type) {
        if (_this2.isTypeGeneric(type)) {
          //this is a generic - specialized using the specialied value
          return "".concat(type.toString(), "<").concat(specialized, ">");
        } else {
          return type;
        }
      }).filter(function (type) {
        return !_this2.isSet(type);
      });
    }
  }, {
    key: "getExpressionsByValueType",
    value: function getExpressionsByValueType(type) {
      var _this3 = this;
      var allowCalc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var expectedRole = arguments.length > 2 ? arguments[2] : undefined;
      if (type.getExpressionsByValueType) {
        type.getExpressionsByValueType(this, allowCalc, expectedRole);
      }
      //get all valueTypes
      var current = Object.keys(this.valueTypeRepo);
      //TODO this next line doesn't make sense but it works. We need to work out the isa relationship with valueTypes
      current = current.filter(function (key) {
        return _this3.isa(type, key) || _this3.isa(key, type);
      });
      //get list of all entities that their valueType is in current
      current = current.map(function (key) {
        return _this3.valueTypeRepo[key];
      });
      //flatten the list
      current = current.flat();
      //if allowCalc is false then only allow if role is not calc
      current = current.filter(function (_ref) {
        var role = _ref.role;
        role = role || _role.Role.calc; //defalt role is calc
        if (expectedRole) {
          //if expectedRole is specified then ignore allowCalc
          return (0, _role.matchRole)(role, expectedRole);
        }
        return allowCalc ? true : role !== _role.Role.calc;
      });
      current = current.map(function (entry) {
        var entryType = entry.type;
        if (_this3.isTypeGeneric(entryType)) {
          //if the retreived type is generic then assume the instantiation of the type takes the searched for valueType as first template argument
          return "".concat(entryType, "<").concat(type, ">");
        } else {
          return entryType;
        }
      });
      return unique(current);
    }
  }, {
    key: "getTypes",
    value: function getTypes() {
      if (this.repo) {
        return Object.keys(this.repo);
      } else {
        return [];
      }
    }

    /**
     * Add a package to the dictionary. the package can either be a string identifying the package or the package object itself
     * @param {Object|String} pckg the package to add
     */
  }, {
    key: "addPackage",
    value: function () {
      var _addPackage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(pckg) {
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              this.packages.push(pckg);
              _context4.next = 3;
              return this.reload();
            case 3:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function addPackage(_x3) {
        return _addPackage.apply(this, arguments);
      }
      return addPackage;
    }()
  }, {
    key: "_isDefinitionGroup",
    value: function _isDefinitionGroup(entity) {
      if (_typeof(entity) !== 'object' || entity === null) {
        return false;
      }
      return this.isa(entity.$type, 'definition group');
    }
    /**
    * Register an instance in the dictionary for later retrieval
    * @param {String} id identification of instance
    * @param {String} type type to register
    * @param {*} value value of instance
    * @param {String} label the name used to display the instance
    * @param {String} description description of the instance. This can be used in suggestions for additional info
    * @param {"artifact"|"value"} role the role of the instance
    * @returns {Reference} a reference to the instance
    */
  }, {
    key: "_registerInstance",
    value: function _registerInstance(entry, pkg) {
      console.assert(pkg, 'missing package');
      var valueType = entry.valueType,
        name = entry.name,
        value = entry.value,
        label = entry.label,
        description = entry.description;
      if (valueType) {
        this._ensureSpecializedIsRegistered(valueType);
        if (!this.instancesByType[valueType]) {
          this.instancesByType[valueType] = [];
        }
        this.instancesByType[valueType].push(entry);
        this.parser.addInstance(entry, pkg);
        this.instances[name] = value;
        return (0, _reference["default"])(label || name, valueType, 'dictionary:' + name, description, value);
      }
    }

    /**
     * @typedef FunctionEntry Define how an action or expression type uses a function. It can specify a function from an imported library, a class function or a predefined function within calling context. For traits, the subject is passed as the `this` object.
     * @property {String} library - export library for this function
     * @property {String} object used for object functions to determine which spec property is associated with the function object
     * @property {String} name - name of the function to call
     * @property {String[]} args an array of spec properties to be called as arguments.
     */
    /**
     * Associate a function with a type name. This is used to define functions used to calculate expressions and execute actions.
     * @param {String} name type name
     * @param {FunctionEntry} functionEntry
     * @param {NaturaPackage} pkg
     */
  }, {
    key: "_registerFunction",
    value: function _registerFunction(name, functionEntry, pkg) {
      if (!functionEntry) {
        return;
      }
      if (typeof functionEntry === 'string') {
        var parsed = functionEntry.match(/^([^@]+)@([^\(]+)(?:\(([^^\)]*)\))?$/);
        (0, _error.assume)(parsed, 'function reference failed to parse', functionEntry);
        this.functions[name] = {
          library: parsed[2],
          name: parsed[1],
          args: parsed[3] ? parsed[3].split(',').map(function (item) {
            return item.trim();
          }) : [],
          pkg: pkg
        };
      } else {
        functionEntry.pkg = pkg;
        this.functions[name] = functionEntry;
      }
    }
  }, {
    key: "getFunctionEntry",
    value: function getFunctionEntry(name) {
      return this.functions[name] || {};
    }

    /**
     * Get a list of references to instances stored in the dictionary.
     * @param {Type} type type of instances to search for
     * @param {"artifact"|"value"} role
     * @returns Reference[]
     */
  }, {
    key: "getInstancesByType",
    value: function getInstancesByType(type, role) {
      var _this4 = this;
      //TODO there is a potential bug because we do not check for uniqueness (like in valueTypeRepo)
      var current = Object.keys(this.instancesByType);
      current = current.filter(function (key) {
        return _this4.isa(key, type);
      });
      current = current.map(function (key) {
        return _this4.instancesByType[key];
      });
      current = current.flat();
      if (role) {
        current = current.filter(function (entry) {
          return entry.role === role;
        });
      }
      current = current.map(function (entry) {
        return Object.assign({}, entry, {
          $type: 'reference'
        });
      });
      return current;
    }
  }, {
    key: "getInstanceByID",
    value: function getInstanceByID(ID) {
      return this.instances[ID];
    }
  }, {
    key: "_processDefinition",
    value: function _processDefinition(entity) {
      var _this5 = this;
      var model = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var pkg = arguments.length > 2 ? arguments[2] : undefined;
      if (_typeof(entity) !== 'object' || entity === null) {
        //nothing to process
        return;
      }

      //ensure model isa is not empty
      model.isa = model.isa || [];
      var memberModel = model;
      if (this._isDefinitionGroup(entity)) {
        entity.members = entity.members || [];
        if (entity.model && _typeof(entity.model) === 'object') {
          entity.model.isa = entity.model.isa || [];
          memberModel = (0, _deepmerge["default"])(model, entity.model);
          //add group isa as a separate subtype of model isa
          entity.model.isa.forEach(function (type) {
            _this5._processDefinition({
              type: type
            }, memberModel, pkg);
          });
        }
        for (var i = 0; i < entity.members.length; ++i) {
          this._processDefinition(entity.members[i], memberModel, pkg);
        }
      } else {
        entity.isa = entity.isa || [];
        this._registerType((0, _spec.specType)(entity), (0, _deepmerge["default"])(model, entity), pkg);
      }
    }
  }, {
    key: "_processPackage",
    value: function _processPackage(pkg) {
      (0, _registerPackage["default"])(this, pkg);
    }

    /**
     * Register a type in the dictionary
     * @param {String} type the type to register. This will be used to retreive the type
     * @param {Object} spec the spec body
     */
  }, {
    key: "_registerType",
    value: function _registerType(type, spec, pkg) {
      var _this6 = this;
      var specType = spec.$type;
      var specTypeSpec = this.getTypeSpec(specType);
      if (typeof specTypeSpec.register === 'function') {
        //the spec defines its own register function - use it
        return specTypeSpec.register(this, type, spec, pkg);
      }
      if (pkg) {
        //connect the spec to the package
        spec.$package = pkg;
      }
      //normalize structure of type spec
      //isa
      spec.isa = spec.isa || [];
      if (!(0, _entity.entityIsArray)(spec.isa)) {
        spec.isa = [spec.isa];
      }

      //properties
      spec.properties = spec.properties || {};

      //pattern
      if (spec.pattern) {
        (0, _pattern.parsePattern)(spec.pattern).fields.forEach(function (field) {
          if (spec.properties[field.name] === undefined && !field.name.includes('|')) {
            spec.properties[field.name] = {
              type: field.type
            };
          }
        });
      }

      //convert properties that are defined as string to object type
      Object.keys(spec.properties).forEach(function (key) {
        if ((0, _entity.entityType)(spec.properties[key]) === 'string') {
          spec.properties[key] = {
            type: spec.properties[key]
          };
        }
      });
      Object.values(spec.properties).forEach(function (prop) {
        return (0, _error.assume)((0, _entity.entityType)(prop) === 'object', 'prop should be an object. it is ' + JSON.stringify(prop));
      });

      //add the type to the repos
      unique(spec.isa).forEach(function (parent) {
        _this6._registerIsa(type, parent);
      });
      if (this.repo[type]) {
        //an entity with this type already exists - warn
        this.logger.warn('[dictionary] Adding an entity to the dictionary with a name that already exists', JSON.stringify(type));
      }
      this.repo[type] = spec;
      this.parser.addType(spec, pkg);
      this._registerValueType(spec.valueType, type, spec.role);
      this._registerFunction(type, spec.fn, pkg);
    }
    /**
     * A specialized type is a type that is derived from a generic type and its insance value is initialized with specific properties. It is a similar concept to genrics in typescript however, the specialized values are part of the instance object. The reason for that is that we need the specialized values in the instance so we can use them in the application. 
     * The properties title, description and pattern in the generic type are treated as handlebars templates where the data is the specialized value object
     * @param {String} type the type name of the specialized type
     * @param {String} generic type name of the generic type
     * @param {Object} specializedValue an object to use as the specialized value of the instance
     * @param {Object} override optional object to override the generic spec properties
     */
  }, {
    key: "_registerSpecializedType",
    value: function _registerSpecializedType(specialized, generic, specializedValue, override) {
      var type = "".concat(generic, "<").concat(specialized, ">");
      var specializedSpec = this.getTypeSpec(specialized);
      var spec = this.getTypeSpec(generic);
      (0, _error.assume)(spec, "Specialized type '".concat(type, "' does not have a generic defined"));
      var sSpec = Object.create(spec);
      sSpec.$specialized = specializedValue;
      sSpec.$generic = generic;

      //calculate title, pattern and description values
      sSpec.title = (0, _template.calcTemplate)(spec.title, specializedValue);
      sSpec.description = (0, _template.calcTemplate)(spec.description, specializedValue);
      sSpec.pattern = (0, _template.calcTemplate)(spec.pattern, specializedValue);

      //assign the override properties to this spec
      Object.assign(sSpec, override);

      //register the type
      this._registerType(type, sSpec, spec.$package);
      return sSpec;
    }
  }, {
    key: "_registerValueType",
    value: function _registerValueType(valueType, type, role) {
      if (!valueType) {
        return;
      }
      valueType = (0, _type["default"])(valueType, null, this).toString(); //turn type objects into strings
      this._ensureSpecializedIsRegistered(valueType);
      if (this.valueTypeRepo[valueType] === undefined) {
        this.valueTypeRepo[valueType] = [];
      }
      this.valueTypeRepo[valueType].push({
        type: type,
        role: role
      });
    }
  }, {
    key: "_registerIsa",
    value: function _registerIsa() {
      //cancelled - do nothing
    }
  }, {
    key: "_registerAssertion",
    value: function _registerAssertion(type, assertion, pkg) {
      this.parser.addAssertion(type, assertion, pkg);
    }
  }, {
    key: "_loadPackage",
    value: function () {
      var _loadPackage2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(pckg) {
        var ret;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              if (!(typeof pckg === 'string')) {
                _context5.next = 5;
                break;
              }
              _context5.next = 3;
              return (0, _loader.loadPackage)(pckg, this.logger);
            case 3:
              ret = _context5.sent;
              return _context5.abrupt("return", ret);
            case 5:
              (0, _error.assume)((0, _entity.entityType)(pckg) === 'object', _error.LoadError, "The '" + pckg + "' package cannot be loaded");

              //convert the raw package object to entity so we can use value functions defined in the specs
              return _context5.abrupt("return", deepCopy(pckg));
            case 7:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));
      function _loadPackage(_x4) {
        return _loadPackage2.apply(this, arguments);
      }
      return _loadPackage;
    }()
    /**
     * Check if `type` is a specialized type like `todo item.<collection>`. If it is a specialized type that is not registered then register it. Currently only single generic property is supported
     * @param {Type} type type to test
     */
  }, {
    key: "_ensureSpecializedIsRegistered",
    value: function _ensureSpecializedIsRegistered(type) {
      var _getSpecializedType3 = getSpecializedType(type),
        generic = _getSpecializedType3.generic,
        specialized = _getSpecializedType3.specialized;
      if (!generic) {
        //this is not a specialized generic
        return;
      }
      if (this.isSet(specialized) || !this.repo[generic]) {
        //specialized value is a set hense the specialized instance is a set
        return;
      }
      var current = this.repo[searchString(type)];
      if (current) {
        //this is already registered
        return;
      }
      var genericSpec = this.getTypeSpec(generic);
      if (!genericSpec) {
        throw new Error('Trying to use a generic that is not defined: ' + searchString(type));
      }
      if (!Array.isArray(genericSpec.genericProperties) || genericSpec.genericProperties.length < 1) {
        //set default generic property to type
        genericSpec.genericProperties = ['type'];
      }
      return this._registerSpecializedType(specialized, generic, _defineProperty({}, genericSpec.genericProperties[0], (0, _type["default"])(specialized, null, this)));
    }

    /** a set is a definition of collection of types. It can be a category that does not have a spec or a generic
     */
  }, {
    key: "isSet",
    value: function isSet(type) {
      var spec = this.getTypeSpec(type);
      if (!spec.name) {
        return true;
      }
      if ((0, _spec.isSpecGeneric)(spec)) {
        return true;
      }
    }
  }]);
  return Dictionary;
}();
exports["default"] = Dictionary;
function deepCopy(source) {
  return (0, _deepmerge["default"])({}, source);
}
function unique(arr) {
  return arr.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}
function searchString(str) {
  return str ? str.searchString || str.toString() : 'any';
}
function getSpecializedType(type) {
  var matched = searchString(type).match(/^([^\.\<\>]+)\.?\<(.+)\>$/);
  return matched ? {
    generic: matched[1],
    specialized: matched[2]
  } : {};
}
var dictionaries = {};
/**
 * get a dictionary from list of packages. If a dictionary with these packags already exists then return it
 */
function getDictionary(_x5, _x6) {
  return _getDictionary.apply(this, arguments);
}
/**
 * A function that can be used to invalidate a package based on its id
 * @param {*} id package id
 */
function _getDictionary() {
  _getDictionary = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(packages, logger) {
    var id, dictionary;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          id = packages.join(',');
          if (!dictionaries[id]) {
            _context6.next = 3;
            break;
          }
          return _context6.abrupt("return", dictionaries[id]);
        case 3:
          dictionary = new Dictionary(packages, logger);
          _context6.next = 6;
          return dictionary.reload();
        case 6:
          dictionaries[id] = dictionary;
          return _context6.abrupt("return", dictionary);
        case 8:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return _getDictionary.apply(this, arguments);
}
function changeListener(id) {
  //invalidate all dictionaries that include the package id
  if (id.startsWith('public:')) {
    id = id.substr('public:'.length);
  }
  Object.keys(dictionaries).forEach(function (key) {
    if (key.split(',').includes(id)) {
      delete dictionaries[key];
    }
  });
}