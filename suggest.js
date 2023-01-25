import {Parser} from './parsely.js'
const MAX_GENERATION = 5;
const PRECEDING_SPACE_TOKEN = '\u2581'
const EOS_TOKEN = '</s>'

export function suggestCompletion(dictionary, text, target='type:interact action', logger){
	logger('before loading grammer');
	const grammer = dictionary.getGrammer();
	logger('got grammer. number of rules',grammer.ParserRules.length);
	grammer.ParserStart = target;
	const tree = new SequenceTree(dictionary);
	logger('start parsing');
	addScannableToTree(grammer, text, '', tree);
	logger('after addScannableToTree')
	const paths = tree.getPaths();
	let generation = 0;
	while(generation < MAX_GENERATION){
		if(paths.length > 1 || paths.length === 0 || paths[0].text.startsWith('^')){
			//we have enought suggestions - return them
			break;
		}
		++ generation;
		const prolog = paths[0].text.match(/^[^\^]/)[0]
		addScannableToTree(grammer, text + prolog, prolog,tree);
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

function textShouldBeExtended(text){
	return text.match(/^[ ,]*$/)
}
function addScannableToTree(grammer, text, prolog='', tree){
	const parser = new Parser(grammer);
	try{
		parser.feed(text);
	}catch(e){
		//console.log('parser got exception. Suggestions will be given based on current state');
	}
	const scannable = parser.table[parser.current].scannable;
	for (let w = scannable.length; w--; ) {
		const state = scannable[w];
		if(isExpendableState(state)){
			//this state is manifested in a different state - we can ignore it
			continue;
		}
		const pathText = tree.add(
			state.rule.symbols.slice(state.dot), 
			state.rule.name,
			prolog
		)
		if(textShouldBeExtended(pathText)){
			addScannableToTree(grammer, text + pathText, prolog + pathText,  tree);
		}
	}
}
function labelFromPath(path){
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

export function suggestTokens(dictionary, text, target='type:interact action'){
	const grammer = dictionary.getGrammer();
	grammer.ParserStart = target;
	const parser = new Parser(grammer);
	//When last token was a part of a token, we need to identify the first part of the token. We assume the feed function will throw the partial token
	let prolog = ''
	try{
		parser.feed(text);
	}catch(e){
		if(e.token.text){
			prolog = e.token.text;
		}
	}
	const ret =  unique(parser.table[parser.current].scannable
		.map(state=>state.rule.symbols[state.dot])
		.map(item=> {
			if(item.literal){
				if(!item.literal.startsWith(prolog)){
					return null;
				}
				return item.literal.substr(prolog.length);
			}
			switch(item.type){
				case 'COMMA':
					return ',';
				case 'SP':
					return '[SP]';
				case 'DBQT_CONTENT':
					return '[ANY]'
				case 'DIGIT':
					return ['0','1','2','3','4','5','6','7','8','9']
				default:
					dictionary.log('unknown type',item.type);
					return '[' + item.type + ']'
			}
		})
		.flat()
	)
	const sp = ret.indexOf('[SP]')
	if(sp >= 0){
		//need to add the tokens following the space
		ret.splice(sp, 1);//delete the space
		const additional = suggestTokens(dictionary, text + ' ', target);
		ret.push(...additional.map(token=> PRECEDING_SPACE_TOKEN + token));
	}
	if(parser.results && parser.results.length > 0){
		ret.push(EOS_TOKEN)
	}
	return ret;
}

/**
 * Find unique items and get rid of nulls
 * @param {*} items 
 * @returns 
 */
function unique(items){
	const obj = {};
	items.forEach(key=>{
		if(key === null || key === undefined){
			return;
		}
		obj[key] = true;
	});
	return Object.keys(obj);
}