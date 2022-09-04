/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import HB from 'handlebars';
import { specContextType } from './spec.js';

const cacheMap = new Map();
//TODO handle situations when cache overflows - use LRU cache
function getCompiled(text){
	if(cacheMap.has(text)){
		return cacheMap.get(text);
	}
	const compiled = HB.compile(text,{noEscape:true});
	cacheMap.set(text,compiled);
	return compiled;
}

/**
 * 
 * @param {String} templateText template text
 * @param {Object} context context for template expansion
 * @param {Boolean} safe if true then don't print error message to log when got exception
 * @returns 
 */
export function calcTemplate(templateText,context,safe){
	if(typeof templateText !== 'string'){
		//if templateText is not a string then return null
		return null;
	}
	try{
		const template = getCompiled(templateText);
		return template(context,{allowProtoPropertiesByDefault:true});
	}catch(e){
		if(safe){
			return null;
		}
		console.error('Error parsing template',JSON.stringify(templateText),'for',context);
	}
}

//register template functions
HB.registerHelper('the',function(type){
	const dictionary = this.$dictionary;
	const spec = dictionary?dictionary.getTypeSpec(type) : {};
	return 'the ' + (spec.name? specContextType(spec) : type)
})
