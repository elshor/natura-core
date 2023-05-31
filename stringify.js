/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */

import { parsePatternParts, parsePattern } from "./pattern.js";
import { calcTemplate } from "./template.js";
import { specComputedPattern } from "./spec.js";

//turn a location into textual representation using type spec
export default async function stringify(def, specInterface){
	let ret = await defAsText(def, specInterface);
	ret = normalizeSpaces(ret);
	ret = normalizeCommas(ret);
	return ret;

}

async function defAsTextFromPattern(pattern, def, specInterface){
	const parsed = parsePatternParts(pattern);
	const parts = [];
	for(let i=0;i<parsed.all.length;++i){
		const part = await processPatternPart(
			parsed.all[i],
			def,
			specInterface,
			parsed.all[i].required
		);
		if(part !== null){
			parts.push(part);
		}
	}
	return parts.join(', ');
}

async function processPatternPart(parsed, def, specInterface, required=true){
	const list  = await Promise.all(
		parsed.elements.map(async el=>{
			if(typeof el === 'string'){
				return el;
			}else{
				const out = await defAsText(def[el.name], specInterface);
				if(out.trim() === ''){
					return required? '' : null;
				}
				return out;
			}
	}))
	if(!required && list.includes(null)){
		return null;
	}
	return list.join('');
}
async function defAsText(def, specInterface){
	if(!def){
		//no def - return an empty string - nothing to return
		return '';
	}
	const spec = await specInterface.getSpec(def);
	if(Array.isArray(def)){
		const list = await Promise.all(def.map(item=>defAsText(item, specInterface)));
		return list.join(', ');
	}	

	if(spec.template){
		//use template to generate string
		const text = calcTemplate(spec.template,def);
		return text;
	}
	
	const pattern = specComputedPattern(spec);
	if(pattern){
		return defAsTextFromPattern(pattern, def, specInterface);
	}

	if(['string','number','boolean'].includes(typeof def)){
		return def.toString();
	}

	return ''
}

function normalizeSpaces(text){
	return text.replace(/  */g,' ');
}

function normalizeCommas(text){
	return text.replace(/\,(\s*\,\s*)+/g,', ')
}