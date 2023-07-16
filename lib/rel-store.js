"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _yaml = _interopRequireDefault(require("yaml"));
var _fs = require("fs");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var PACKAGES_URI = 'https://natura.dev/packages/';
var RelStore = /*#__PURE__*/function () {
  function RelStore() {
    _classCallCheck(this, RelStore);
    this.facts = [];
    this.rules = [];
    this.matchMemory = {};

    //HACK should be part of packages
    this.loadRules('/ml/natura-core/rules.yaml');
  }
  _createClass(RelStore, [{
    key: "clearCache",
    value: function clearCache() {
      this.matchMemory = {};
    }
  }, {
    key: "addRule",
    value: function addRule(predicate, statements) {
      this.rules.push(new Rule(predicate, statements));
      this.clearCache();
    }
  }, {
    key: "addAssertion",
    value: function addAssertion(type, assertion, pkg) {
      var parsed = assertion.match(/^(.*)\<(.*)\>$/);
      console.assert(parsed, 'assertion not matching pattern: ' + assertion);
      console.assert(typeof pkg === 'string', 'package must be a string');
      this.addRel(type, parsed[1], parsed[2], pkg);
    }
  }, {
    key: "addRel",
    value: function addRel(subject, rel, object) {
      console.assert(rel.includes('-'), 'rel name must includes a -. Rel is ' + rel);
      this.facts.push(new Fact(subject, rel, object));
      this.clearCache();
    }
  }, {
    key: "matchFact",
    value: function matchFact(subject, predicate, object) {
      var fuzzy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var ret = [];
      this.facts.forEach(function (fact) {
        var binding = fact.bind(subject, predicate, object, fuzzy);
        if (binding) {
          ret.push(binding);
        }
      });
      return ret;
    }
  }, {
    key: "match",
    value: function match(subject, predicate, object) {
      var _this = this;
      var fuzzy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var text = JSON.stringify([subject, predicate, object, fuzzy]);
      if (this.matchMemory[text]) {
        return this.matchMemory[text];
      }
      //console.log('?',subject, predicate, object, fuzzy);
      var ret = this.matchFact(subject, predicate, object, fuzzy);
      this.rules.forEach(function (rule) {
        var bindings = rule.bind(subject, predicate, object, fuzzy, _this);
        ret.push.apply(ret, _toConsumableArray(bindings));
      });

      //console.log('=>',subject, predicate, object, fuzzy,'===>', ret.length);
      this.matchMemory[text] = ret;
      return ret;
    }
  }, {
    key: "query",
    value: function query(predicate, object, fuzzy) {
      var bindings = this.match('T', predicate, object, fuzzy);
      return unique(bindings.map(function (b) {
        var _b$assumptions;
        return ((_b$assumptions = b.assumptions) === null || _b$assumptions === void 0 ? void 0 : _b$assumptions.length) > 0 ? new FuzzyTerm(b.T, b.assumptions) : b.T;
      }));
    }
  }, {
    key: "getByAssertion",
    value: function getByAssertion(assertion, pkg) {
      try {
        var parsed = assertion.match(/^(.*)\<(.*)\>$/);
        if (!parsed) {
          //this is not an assertion - return empty list
          return [];
        }
        var res = this.query(parsed[1], parsed[2]).filter(function (t) {
          return !t.assumptions;
        });
        return res;
      } catch (e) {
        console.error('EXCEPTION looking for', assertion, '\n', e);
        throw new Error('rel store failed to look for ' + assertion);
      }
    }
  }, {
    key: "getByAssertionFuzzy",
    value: function getByAssertionFuzzy(assertion, pkg) {
      try {
        var parsed = assertion.match(/^(.*)\<(.*)\>$/);
        if (!parsed) {
          //this is not an assertion - return empty list
          return [];
        }
        var res = this.query(parsed[1], parsed[2], true);
        return res.filter(function (t) {
          return t.assumptions;
        });
      } catch (e) {
        console.error('EXCEPTION looking for', assertion, '\n', e);
        throw new Error('rel store failed to look for ' + assertion);
      }
    }
  }, {
    key: "getByAssertionAll",
    value: function getByAssertionAll(assertion, pkg) {
      try {
        var parsed = assertion.match(/^(.*)\<(.*)\>$/);
        if (!parsed) {
          //this is not an assertion - return empty list
          return [];
        }
        var res = this.query(parsed[1], parsed[2], true);
        return res;
      } catch (e) {
        console.error('EXCEPTION looking for', assertion, '\n', e);
        throw new Error('rel store failed to look for ' + assertion);
      }
    }
  }, {
    key: "getAssertions",
    value: function getAssertions() {
      var ret = {};
      this.facts.forEach(function (fact) {
        ret[fact.predicate + '<' + fact.object + '>'] = true;
      });
      return Object.keys(ret);
    }
  }, {
    key: "loadRules",
    value: function loadRules(path) {
      var _this2 = this;
      var text = (0, _fs.readFileSync)(path, 'utf-8');
      var json = _yaml["default"].parse(text);
      json.forEach(function (rule) {
        return _this2.addRule(rule.result, rule.from);
      });
    }
  }]);
  return RelStore;
}();
exports["default"] = RelStore;
var Fact = /*#__PURE__*/function () {
  function Fact(subject, predicate, object) {
    _classCallCheck(this, Fact);
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
  }
  _createClass(Fact, [{
    key: "bind",
    value: function bind(subject, predicate, object, fuzzy) {
      var bindings = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
      var s = bindItem(this.subject, subject, bindings);
      var p = bindItem(this.predicate, predicate, bindings);
      var o = bindItem(this.object, object, bindings);
      if (p || !fuzzy) {
        return mergeBindings(s, p, o);
      }
      //fuzzy processing
      var fuzzyP = bindItem(this.predicate, 'maybe-' + predicate, bindings);
      return mergeBindings(s, fuzzyP, o, {
        assumptions: [[this.subject, predicate, this.object]]
      });
    }
  }]);
  return Fact;
}();
var ANY = {};
var Rule = /*#__PURE__*/function () {
  function Rule(result, statements) {
    _classCallCheck(this, Rule);
    this.result = result;
    this.statements = statements;
    console.assert(this.result.length >= 3, 'Rule missing result terms: ' + JSON.stringify(this.result));
    console.assert(Array.isArray(this.statements, 'Rule statements need to be an array'));
    this.statements.forEach(function (stmt) {
      return console.assert(stmt.length >= 3, 'Rule statement missing terms: ' + JSON.stringify(stmt));
    });
  }
  _createClass(Rule, [{
    key: "bind",
    value: function bind(subject, predicate, object, fuzzy, kb) {
      var _Fact;
      var start = (_Fact = new Fact(subject, predicate, object)).bind.apply(_Fact, _toConsumableArray(this.result).concat([fuzzy]));
      if (!start) {
        //rule doesn't match pattern
        return [];
      }
      var mapping = {};
      Object.entries(start).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];
        if (isVariable(value.toString())) {
          mapping[value] = key;
          delete start[key];
        }
      });
      var stateBindings = [start];
      for (var i = 0; i < this.statements.length; ++i) {
        var stmt = this.statements[i];
        var newBindings = [];
        var _loop = function _loop() {
          var b = stateBindings[j];
          var temp = stmt[3] === 'fact' ? kb.matchFact(b[stmt[0]] || stmt[0], b[stmt[1]] || stmt[1], b[stmt[2]] || stmt[2], fuzzy) : kb.match(b[stmt[0]] || stmt[0], b[stmt[1]] || stmt[1], b[stmt[2]] || stmt[2], fuzzy);
          var generatedBindings = temp.map(function (o) {
            return mergeBindings(b, o);
          });
          newBindings.push.apply(newBindings, _toConsumableArray(generatedBindings));
        };
        for (var j = 0; j < stateBindings.length; ++j) {
          _loop();
        }
        stateBindings = newBindings;
      }
      return stateBindings.map(function (binding) {
        //map the rule variables to the external variables
        var ret = {
          assumptions: binding.assumptions
        };
        Object.entries(mapping).forEach(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
            key = _ref4[0],
            value = _ref4[1];
          ret[key] = binding[value];
        });
        return ret;
      });
    }
  }]);
  return Rule;
}();
function isVariable(item) {
  return item.match(/^[A-Z]/);
}
function bindItem(fact, rule, bindings) {
  if (isVariable(rule)) {
    if (bindings[rule] !== undefined) {
      return bindings[rule] === fact ? {} : null;
    } else {
      return _defineProperty({}, rule, fact);
    }
  } else {
    return fact === rule ? {} : null;
  }
}
var FuzzyTerm = /*#__PURE__*/function () {
  function FuzzyTerm(name, assumptions) {
    _classCallCheck(this, FuzzyTerm);
    this.name = name;
    this.assumptions = assumptions || [];
  }
  _createClass(FuzzyTerm, [{
    key: "toString",
    value: function toString() {
      return this.name;
    }
  }]);
  return FuzzyTerm;
}();
function mergeBindings() {
  var ret = {
    assumptions: []
  };
  for (var i = 0; i < arguments.length; ++i) {
    var b = i < 0 || arguments.length <= i ? undefined : arguments[i];
    if (_typeof(b) !== 'object' || b === null) {
      return null;
    }
    Object.entries(b).forEach(function (_ref6) {
      var _ref7 = _slicedToArray(_ref6, 2),
        key = _ref7[0],
        value = _ref7[1];
      if (key === 'assumptions' && Array.isArray(value)) {
        var _ret$assumptions;
        (_ret$assumptions = ret.assumptions).push.apply(_ret$assumptions, _toConsumableArray(value));
        return;
      }
      ret[key] = value;
    });
  }
  return ret;
}
function unique(arr) {
  //NOTE this function is not complete and it can miss duplicates
  var seen = {};
  arr.forEach(function (item) {
    //first pass - remove exact duplicates
    var text = termAsCanonicalText(item);
    if (!seen[text]) {
      seen[text] = item;
    }
  });

  //second pass - remove terms where assumptions are contained in other terms
  var sorted = Object.keys(seen).sort();
  var last = '^';
  for (var i = 0; i < sorted.length; ++i) {
    if (sorted[i].startsWith(last)) {
      //remove this item - last item requires less assumptinos
      delete seen[sorted[i]];
    } else {
      last = sorted[i];
    }
  }
  return Object.values(seen);
}
function termAsCanonicalText(term) {
  if (!term.assumptions) {
    //no assumptions - easiest
    return term + ':';
  }
  return term.name + ': ' + term.assumptions.map(function (item) {
    return JSON.stringify(item);
  }).sort().join('');
}