import {Parser} from './parsely.js'

export default function suggest(dictionary, text, target='type:interact action'){
	const grammer = dictionary.getGrammer();
	grammer.ParserStart = target;
	const parser = new Parser(grammer);
	try{
		parser.feed(text);
	}catch(e){
		console.log('got exception',e);
	}
	const column = parser.table[parser.current];
	const scannable = column.scannable;
	if(scannable.length === 1){
		//start suggestions from after the expected token
		text = text + pathItemAsText(scannable[0].rule.symbols[scannable[0].dot]);
		return suggest(dictionary, text, target);
	}
	const tree = new SequenceTree(dictionary);
	for (let w = scannable.length; w--; ) {
			const state = scannable[w];
			tree.add(state.rule.symbols.slice(state.dot), state.rule.name)
	}
	tree.dumpPaths();
	const paths = tree.getPaths();
	console.log(paths);
	const ret = {
		backText: '',
		list: paths
		.map(path=>{
			return {
				text: path,
				label: labelFromPath(path),
				snippet: pathAsSnippet(path)
			}
		}) 
	}
	return ret;
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
	add(path, name){
		console.log('add',this.dictionary.getTypeSpec(searchName(name)).description,'=>', path);
		let current = this.head;
		for(let i = 0;i < path.length; ++i){
			const item = path[i];
			if(item.literal){
				current = this._nextText(current, item.literal)
			}else if(item === '_'){
				current = this._nextText(current, ' ');
			}else if(typeof item === 'string'){
				current = this._nextSymbol(current, item);
			}else if(item.type === 'SP'){
				current = this._nextText(current, ' ');
			}else{
				console.log('unidentified item',path[i])
			}
		}
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
			//this is a terminal node
			return current;
		}
		const children = values.map(childNode=>this.getPaths(childNode))
		return children.flat().map(child=>current + child);
	}
	dumpPaths(){
		const paths = this.getPaths(this.head);
		paths.forEach(path=>console.log(path));
	}
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
	return path.replace(/\s*\^[ \^]*/g,' ${} ')
}

function searchName(name){
	return name
		.replace(/<.*>$/,'')
		.replace(/^type\:/,'');
}