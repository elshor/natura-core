/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */

import { parsePattern } from "./pattern.js";
import { calcTemplate } from "./template.js";
import { specComputedPattern } from "./spec.js";

//turn a location into textual representation using type spec
export default function stringify(location){
	const ret = locationAsText(location);
	return normalizeSpaces(ret);
}

function locationAsText(location){
	const spec = location.spec;
	if(spec.template){
		//use template to generate string
		const text = calcTemplate(spec.template,location.context);
		return text;
	}
	
	const pattern = specComputedPattern(spec);
	if(pattern){
		return parsePattern(pattern).elements
		.map(el=>{
			if(typeof el === 'string'){
				return el;
			}else{
				return locationAsText(location.child(el.name));
			}
		})
		.join('');
	}
	if(Array.isArray(location.value)){
		const length = location.value.length;
		const array = [];
		for(let i=0;i<length;++i){
			array.push(locationAsText(location.child(i)));
		}
		return array.join(', ');
	}
	if(spec.show){
		//generate a list of show properties 
		return '(' +
			spec.show.map(prop=>`${propTitle(location,prop)}: ${locationAsText(location.child(prop))}`)
	}
	
	if(['string','number','boolean'].includes(typeof location.value)){
		return location.value.toString();
	}

	return ''
}

function propTitle(location,prop){
	const spec = location.spec;
	if(spec.properties && spec.properties[prop]){
		return spec.properties[prop].title || prop;
	}else{
		return prop;
	}
}

function normalizeSpaces(text){
	return text.replace(/  */g,' ');
}