/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */

import { parsePattern } from "./pattern.js";
import { calcTemplate } from "./template.js";
import { specComputedPattern } from "./spec.js";

//turn a location into textual representation using type spec
export default async function stringify(def, specInterface){
	const ret = await defAsText(def, specInterface);
	return normalizeSpaces(ret);
}

async function defAsText(def, specInterface){
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
		const list  = await Promise.all(
			parsePattern(pattern).elements.map(el=>{
				if(typeof el === 'string'){
					return el;
				}else{
					return defAsText(def[el.name], specInterface);
				}
		}))
		return list.join('');
	}

	if(['string','number','boolean'].includes(typeof def)){
		return def.toString();
	}

	return ''
}

function normalizeSpaces(text){
	return text.replace(/  */g,' ');
}
