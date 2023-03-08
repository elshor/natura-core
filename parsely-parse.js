import {Parser} from './parsely.js'

const CACHE = []
const CACHE_SIZE = 10;

/**
 * Parse a text using the grammer. Cache old parsers for reuse. If parsing receives an exception then return the parser at its state
 * @param {String} text 
 * @param {Grammer} grammer 
 */
export default function parseText(text, grammer){
	//create parser
	const parser = new Parser(grammer,null, {keepHistory:false});
	const fullText = text;
	//search cache for state
	for(let i=CACHE.length-1;i>=0;--i){
		if(text.startsWith(CACHE[i].text)){
			//use this state - assume the longest state is pushed last
			parser.restore(CACHE[i].column);
			text = text.substring(CACHE[i].text.length);
			break;
		}
	}
	try{
		parser.feed(text);
	}catch(e){
		//throw the regular exception + parser at current state
		throw Object.assign(e,{parser});
	}
	CACHE.push({
		text: fullText,
		column: parser.save()
	})
	if(CACHE.length > CACHE_SIZE){
		CACHE.shift();
	}
	return parser;
}

