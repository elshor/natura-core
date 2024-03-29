import parseText from './parsely-parse.js';
const MAX_GENERATION = 5;
const PRECEDING_SPACE_TOKEN = '\u2581'
const EOS_TOKEN = '</s>'
const DBQT_CONTENT_REGEX = '/[^"]+|\\\\"/'

export function suggestCompletion(dictionary, text, target='type:interact action', logger){
	const grammer = dictionary.getGrammer();
	grammer.ParserStart = target;
	const tree = new SequenceTree(dictionary);
	addScannableToTree(grammer, text, '', tree, dictionary);
	logger.debug('after addScannableToTree')
	const paths = tree.getPaths();
	let generation = 0;
	while(generation < MAX_GENERATION){
		if(paths.length > 1 || paths.length === 0 || paths[0].text.startsWith('^')){
			//we have enought suggestions - return them
			break;
		}
		++ generation;
		const prolog = paths[0].text.match(/^[^\^]/)[0]
		addScannableToTree(grammer, text + prolog, prolog,tree, dictionary);
	}
	return {
		backText: '',
		list: paths
		.map(path=>{
			return {
				text: path.text,
				label: labelFromPath(path.text),
				snippet: pathAsSnippet(path.text),
				description: path.info.description
			}
		}) 
	}		
}

function textShouldBeExtended(text, prolog){
	if(prolog.endsWith(' ') && text.match(/^ *$/)){
		//prolog ends with space - no need to add space
		return false;
	}
	if(prolog.endsWith(',') && text.match(/^ $/)){
		//add space after comma
		return true;
	}
	if(prolog.match(/, +$/)){
		//prolog already ends with comma, no need to add comma
		return false;
	}
	//by now we established that prolog does not end with comma
	if(text.match(/^, +$/)){
		//add comma
		return true;
	}
	return false;
}

function addScannableToTree(grammer, text, prolog='', tree, dictionary){
	let parser;
	try{
		parser = parseText(text, grammer)
	}catch(e){
		parser = e.parser
	}
	const scannable = parser.table[parser.current].scannable;
	for (let w = scannable.length; w--; ) {
		const state = scannable[w];
		if(isExpendableState(state)){
			//this state is manifested in a different state - we can ignore it
			continue;
		}
		//check if rule has noSuggest property
		if(state.rule.noSuggest){
			continue;
		}
		const pathText = tree.add(
			state.rule.symbols.slice(state.dot), 
			state.rule.name,
			prolog
		)
		if(textShouldBeExtended(pathText, prolog)){
			//if we need to add a comma or space then add it
			addScannableToTree(grammer, text + pathText, prolog + pathText,  tree, dictionary);
		}
	}
}
function labelFromPath(path){
	if(path === '"^"'){
		return '" fill-in text "';
	}
	return path
		.replace(/\s*\^[ \^]*/g,' ... ');
}

class SequenceTree{
	constructor(dictionary){
		this.dictionary = dictionary;
		this.head = {type: 'head',next:{}}
	}
	_nextText(current, text){
		if(current.next[text]){
			return current.next[text];
		}else{
			const ret = {type: 'text', text, next:{}};
			current.next[text] = ret;
			return ret;
		}
	}
	_nextSymbol(current, symbol){
		let ret = current.next['^']
		if(ret){
			if(!ret.symbols.includes(symbol)){
				ret.symbols.push(symbol);
			}
		}else{
			ret = {type: 'symbol',symbols:[symbol], next:{}};
			current.next['^'] = ret;
		}
		return ret;
	}
	add(path, name, prolog = ''){
		const description = this.dictionary.getTypeSpec(searchName(name)).description;
		let current = this.head;
		if(prolog.length > 0){
			current = this._nextText(current, prolog);
		}

		let pathText = prolog;
		for(let i = 0;i < path.length; ++i){
			const item = path[i];
			if(item.literal){
				current = this._nextText(current, item.literal)
				pathText += item.literal;
			}else if(item === '_'){
				current = this._nextText(current, ' ');
				pathText += ' ';
			}else if(typeof item === 'string' && item.startsWith('value:string')){
				current = this._nextText(current, '"^"');
				pathText += '"^"';
			}else if(typeof item === 'string'){
				current = this._nextSymbol(current, item);
				pathText += '^';
			}else if(item.type === 'SP'){
				current = this._nextText(current, ' ');
				pathText += ' ';
			}else if(item.type === 'COMMA'){
				current = this._nextText(current, ', ');
				pathText += ', '
			}else{
				//console.log('unidentified item',path[i])
			}
		}
		if(description){
			//add info in the end of the path
			current.info = mergeInfo(current.info,{description});
		}
		return pathText;
	}
	getPaths(node){
		node = node || this.head;
		const current = 
			node.type === 'head'? '' :
			node.type === 'text'? node.text : 
			node.type == 'symbol' && node.symbols[0] === 'dbqt-text'? '"^"' :
			node.type == 'symbol'? '^' : 'UNKNOWN';
		const values = Object.values(node.next);
		if(node.type === 'symbol'){
		}
		if(values.length === 0){
			if(node.type === 'head'){
				return []
			}
			return [{
				text: current,
				info: node.info || {}
			}]
		}
		const children = values.map(childNode=>this.getPaths(childNode)).flat();
		if(node.type === 'head'){
			//head has nothing to add - just pass childern
			return children;
		}
		return children.map(child=>{
			return {
				text: current + child.text,
				info: mergeInfo(node.info, child.info)
			}
		});
	}
	dumpPaths(){
		const paths = this.getPaths(this.head);
		paths.forEach(path=>console.info(path));
	}
}

function mergeInfo(target, source){
	if(!target){
		return source;
	}
	if(!source){
		return target;
	}
	if(source.description !== target.description){
		//console.log('info conflict',source, target);
	}
	return source || {};
}
function pathItemAsText(item){
	if(item.literal){
		return item.literal;
	}else if(item.type === 'SP'){
		return ' '
	}else if(item.type === 'COMMA'){
		return ','
	}else{
		return '{UNKNOWN}'
	}
}

function pathAsSnippet(path){
	return path
		.replace(/\s*\^[ \^]*/g,' ${} ')
		.replace(/\" \$\{\} \"/g, '"${}"${}')
}

function searchName(name){
	return name
		.replace(/<.*>$/,'')
		.replace(/^type\:/,'');
}

function isExpendableState(state){
	if(
		state.wantedBy && 
		state.wantedBy.length === 1 && 
		state.wantedBy[0].rule.name === 'FRAGMENT_SEP'
	){
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
export function suggestTokens(
	dictionary, 
	text, 
	target='query', 
	options = {},
	logger
){
	const precedingSpace = options.precedingSpace || PRECEDING_SPACE_TOKEN;
	const eosToken = options.eosToken || EOS_TOKEN;
	const grammer = dictionary.getGrammer();
	grammer.ParserStart = target;
	grammer.start = target;
	let parser;
	//When last token was a part of a token, we need to identify the first part of the token. We assume the feed function will throw the partial token
	let prolog = ''
	try{
		parser = parseText(text, grammer)
	}catch(e){
		if(e.token && e.token.text){
			prolog = e.token.text;
		}else{
			console.error(e);
			throw e;
		}
		parser = e.parser;
	}
	const scannables = parser.table[parser.current].scannable;
	const ret = parser? unique(scannables
		.map(state=>state.rule.symbols[state.dot])
		.map(item=> {
			if(item?.example){
				if(!item.example.startsWith(prolog)){
					return null;
				}
				return item.example.substr(prolog.length);
			}
			if(item?.literal){
				if(!item.literal.startsWith(prolog)){
					return null;
				}
				return item.literal.substr(prolog.length);
			}
			if(item.toString() === DBQT_CONTENT_REGEX){
				//this matches the inside of a double quoted string
				return defaultValue(options.ANY, '[ANY]')
			}
			switch(item.type){
				case 'COMMA':
					return ',';
				case 'DBQT':
					return defaultValue(options.DBQT,'"');
				case 'SP':
					return '[SP]';
				case 'DIGIT':
					return defaultValue(options.DIGIT, ['0','1','2','3','4','5','6','7','8','9'])
				case 'DIGITS':
					return defaultValue(options.DIGITS,'[DIGITS]')
				default:
					logger.log('unknown type',item.type);
					return '[' + item.type + ']'
			}
		})
		.flat()
	) : [];
	const sp = ret.indexOf('[SP]')
	if(sp >= 0 && !text.endsWith(' ')){
		//need to add the tokens following the space
		ret.splice(sp, 1);//delete the space
		const additional = suggestTokens(
			dictionary, 
			text + ' ', 
			target, 
			options, 
			logger
		);
		ret.push(...additional.map(token=> precedingSpace + token));
	}
	if(parser?.results && parser.results.length > 0){
		ret.push(eosToken)
	}
	return ret;
}

/**
 * Find unique items and get rid of nulls
 * @param {*} items 
 * @returns 
 */
function unique(items){
	if(!Array.isArray(items)){
		return [];
	}
	const obj = {};
	items.forEach(key=>{
		if(key === null || key === undefined){
			return;
		}
		obj[key] = true;
	});
	return Object.keys(obj);
}

function defaultValue(value, defaultValue){
	//if value is null then return null, not the default value
	return value === undefined? defaultValue : value;
}