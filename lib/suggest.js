"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.suggestCompletion = suggestCompletion;
exports.suggestTokens = suggestTokens;
var _parselyParse = _interopRequireDefault(require("./parsely-parse.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var MAX_GENERATION = 5;
var PRECEDING_SPACE_TOKEN = "\u2581";
var EOS_TOKEN = '</s>';
var DBQT_CONTENT_REGEX = '/[^"]+|\\\\"/';
function suggestCompletion(dictionary, text) {
  var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'type:interact action';
  var logger = arguments.length > 3 ? arguments[3] : undefined;
  var grammer = dictionary.getGrammer();
  grammer.ParserStart = target;
  var tree = new SequenceTree(dictionary);
  addScannableToTree(grammer, text, '', tree, dictionary);
  logger.debug('after addScannableToTree');
  var paths = tree.getPaths();
  var generation = 0;
  while (generation < MAX_GENERATION) {
    if (paths.length > 1 || paths.length === 0 || paths[0].text.startsWith('^')) {
      //we have enought suggestions - return them
      break;
    }
    ++generation;
    var prolog = paths[0].text.match(/^[^\^]/)[0];
    addScannableToTree(grammer, text + prolog, prolog, tree, dictionary);
  }
  return {
    backText: '',
    list: paths.map(function (path) {
      return {
        text: path.text,
        label: labelFromPath(path.text),
        snippet: pathAsSnippet(path.text),
        description: path.info.description
      };
    })
  };
}
function textShouldBeExtended(text, prolog) {
  if (prolog.endsWith(' ') && text.match(/^ *$/)) {
    //prolog ends with space - no need to add space
    return false;
  }
  if (prolog.endsWith(',') && text.match(/^ $/)) {
    //add space after comma
    return true;
  }
  if (prolog.match(/, +$/)) {
    //prolog already ends with comma, no need to add comma
    return false;
  }
  //by now we established that prolog does not end with comma
  if (text.match(/^, +$/)) {
    //add comma
    return true;
  }
  return false;
}
function addScannableToTree(grammer, text) {
  var prolog = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var tree = arguments.length > 3 ? arguments[3] : undefined;
  var dictionary = arguments.length > 4 ? arguments[4] : undefined;
  var parser;
  try {
    parser = (0, _parselyParse["default"])(text, grammer);
  } catch (e) {
    parser = e.parser;
  }
  var scannable = parser.table[parser.current].scannable;
  for (var w = scannable.length; w--;) {
    var state = scannable[w];
    if (isExpendableState(state)) {
      //this state is manifested in a different state - we can ignore it
      continue;
    }
    //check if rule has noSuggest property
    if (state.rule.noSuggest) {
      continue;
    }
    var pathText = tree.add(state.rule.symbols.slice(state.dot), state.rule.name, prolog);
    if (textShouldBeExtended(pathText, prolog)) {
      //if we need to add a comma or space then add it
      addScannableToTree(grammer, text + pathText, prolog + pathText, tree, dictionary);
    }
  }
}
function labelFromPath(path) {
  if (path === '"^"') {
    return '" fill-in text "';
  }
  return path.replace(/\s*\^[ \^]*/g, ' ... ');
}
var SequenceTree = /*#__PURE__*/function () {
  function SequenceTree(dictionary) {
    _classCallCheck(this, SequenceTree);
    this.dictionary = dictionary;
    this.head = {
      type: 'head',
      next: {}
    };
  }
  _createClass(SequenceTree, [{
    key: "_nextText",
    value: function _nextText(current, text) {
      if (current.next[text]) {
        return current.next[text];
      } else {
        var ret = {
          type: 'text',
          text: text,
          next: {}
        };
        current.next[text] = ret;
        return ret;
      }
    }
  }, {
    key: "_nextSymbol",
    value: function _nextSymbol(current, symbol) {
      var ret = current.next['^'];
      if (ret) {
        if (!ret.symbols.includes(symbol)) {
          ret.symbols.push(symbol);
        }
      } else {
        ret = {
          type: 'symbol',
          symbols: [symbol],
          next: {}
        };
        current.next['^'] = ret;
      }
      return ret;
    }
  }, {
    key: "add",
    value: function add(path, name) {
      var prolog = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var description = this.dictionary.getTypeSpec(searchName(name)).description;
      var current = this.head;
      if (prolog.length > 0) {
        current = this._nextText(current, prolog);
      }
      var pathText = prolog;
      for (var i = 0; i < path.length; ++i) {
        var item = path[i];
        if (item.literal) {
          current = this._nextText(current, item.literal);
          pathText += item.literal;
        } else if (item === '_') {
          current = this._nextText(current, ' ');
          pathText += ' ';
        } else if (typeof item === 'string' && item.startsWith('value:string')) {
          current = this._nextText(current, '"^"');
          pathText += '"^"';
        } else if (typeof item === 'string') {
          current = this._nextSymbol(current, item);
          pathText += '^';
        } else if (item.type === 'SP') {
          current = this._nextText(current, ' ');
          pathText += ' ';
        } else if (item.type === 'COMMA') {
          current = this._nextText(current, ', ');
          pathText += ', ';
        } else {
          //console.log('unidentified item',path[i])
        }
      }
      if (description) {
        //add info in the end of the path
        current.info = mergeInfo(current.info, {
          description: description
        });
      }
      return pathText;
    }
  }, {
    key: "getPaths",
    value: function getPaths(node) {
      var _this = this;
      node = node || this.head;
      var current = node.type === 'head' ? '' : node.type === 'text' ? node.text : node.type == 'symbol' && node.symbols[0] === 'dbqt-text' ? '"^"' : node.type == 'symbol' ? '^' : 'UNKNOWN';
      var values = Object.values(node.next);
      if (node.type === 'symbol') {}
      if (values.length === 0) {
        if (node.type === 'head') {
          return [];
        }
        return [{
          text: current,
          info: node.info || {}
        }];
      }
      var children = values.map(function (childNode) {
        return _this.getPaths(childNode);
      }).flat();
      if (node.type === 'head') {
        //head has nothing to add - just pass childern
        return children;
      }
      return children.map(function (child) {
        return {
          text: current + child.text,
          info: mergeInfo(node.info, child.info)
        };
      });
    }
  }, {
    key: "dumpPaths",
    value: function dumpPaths() {
      var paths = this.getPaths(this.head);
      paths.forEach(function (path) {
        return console.info(path);
      });
    }
  }]);
  return SequenceTree;
}();
function mergeInfo(target, source) {
  if (!target) {
    return source;
  }
  if (!source) {
    return target;
  }
  if (source.description !== target.description) {
    //console.log('info conflict',source, target);
  }
  return source || {};
}
function pathItemAsText(item) {
  if (item.literal) {
    return item.literal;
  } else if (item.type === 'SP') {
    return ' ';
  } else if (item.type === 'COMMA') {
    return ',';
  } else {
    return '{UNKNOWN}';
  }
}
function pathAsSnippet(path) {
  return path.replace(/\s*\^[ \^]*/g, ' ${} ').replace(/\" \$\{\} \"/g, '"${}"${}');
}
function searchName(name) {
  return name.replace(/<.*>$/, '').replace(/^type\:/, '');
}
function isExpendableState(state) {
  if (state.wantedBy && state.wantedBy.length === 1 && state.wantedBy[0].rule.name === 'FRAGMENT_SEP') {
    return true;
  }
  return false;
}

/**
 * Generate tokens. Options are:
 * - precedingSpace
 * - eosToken
 * - ANY
 * - DBQT
 * - DIGIT
 * @param {*} dictionary 
 * @param {*} text 
 * @param {*} target 
 * @param {*} options 
 * @param {*} logger 
 * @returns 
 */
function suggestTokens(dictionary, text) {
  var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'type:interact action';
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var logger = arguments.length > 4 ? arguments[4] : undefined;
  logger.log('in suggestTokens nodejs side');
  var precedingSpace = options.precedingSpace || PRECEDING_SPACE_TOKEN;
  var eosToken = options.eosToken || EOS_TOKEN;
  var grammer = dictionary.getGrammer();
  grammer.ParserStart = target;
  var parser;
  //When last token was a part of a token, we need to identify the first part of the token. We assume the feed function will throw the partial token
  var prolog = '';
  try {
    parser = (0, _parselyParse["default"])(text, grammer);
  } catch (e) {
    if (e.token && e.token.text) {
      prolog = e.token.text;
    }
    parser = e.parser;
  }
  var ret = unique(parser.table[parser.current].scannable.map(function (state) {
    return state.rule.symbols[state.dot];
  }).map(function (item) {
    if (item.example) {
      if (!item.example.startsWith(prolog)) {
        return null;
      }
      return item.example.substr(prolog.length);
    }
    if (item.literal) {
      if (!item.literal.startsWith(prolog)) {
        return null;
      }
      return item.literal.substr(prolog.length);
    }
    if (item.toString() === DBQT_CONTENT_REGEX) {
      //this matches the inside of a double quoted string
      return defaultValue(options.ANY, '[ANY]');
    }
    switch (item.type) {
      case 'COMMA':
        return ',';
      case 'DBQT':
        return defaultValue(options.DBQT, '"');
      case 'SP':
        return '[SP]';
      case 'DIGIT':
        return defaultValue(options.DIGIT, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      case 'DIGITS':
        return defaultValue(options.DIGITS, '[DIGITS]');
      default:
        logger.log('unknown type', item.type);
        return '[' + item.type + ']';
    }
  }).flat());
  var sp = ret.indexOf('[SP]');
  if (sp >= 0 && !text.endsWith(' ')) {
    //need to add the tokens following the space
    ret.splice(sp, 1); //delete the space
    var additional = suggestTokens(dictionary, text + ' ', target, options, logger);
    ret.push.apply(ret, _toConsumableArray(additional.map(function (token) {
      return precedingSpace + token;
    })));
  }
  if (parser.results && parser.results.length > 0) {
    ret.push(eosToken);
  }
  return ret;
}

/**
 * Find unique items and get rid of nulls
 * @param {*} items 
 * @returns 
 */
function unique(items) {
  var obj = {};
  items.forEach(function (key) {
    if (key === null || key === undefined) {
      return;
    }
    obj[key] = true;
  });
  return Object.keys(obj);
}
function defaultValue(value, defaultValue) {
  //if value is null then return null, not the default value
  return value === undefined ? defaultValue : value;
}