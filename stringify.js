/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */

import { parsePattern } from "./pattern.js";
import { calcTemplate } from "./template.js";
import { specComputedPattern } from "./spec.js";
import { assume } from "./error.js";

/**
 * @typedef {StringifyOptions}
 * @prop {Boolean} replaceEmptyWithEllipsis
 */
//turn a location into textual representation using type spec
export default function stringify(location, options={}){
	const ret = locationAsText(location, options);
	return normalizeSpaces(ret);
}

function locationAsText(location, options){
	assume(options);
	const spec = location.spec;
	if(location.value === undefined && options.replaceEmptyWithEllipsis){
		return '...'
	}
	if(location.type.isCollection){
		//this is an array. need to generate text for its children and join them
		return location.children.map(l => locationAsText(l, options)).join(', ');
	}
	if(spec.template){
		//use template to generate string
		const text = calcTemplate(spec.template,location.context);
		return text;
	}
	
	const pattern = specComputedPattern(spec);
	if(pattern){
		return processPattern(location, pattern, options)
	}

	const value = location.value;
	//handle references
	if(typeof value === 'object' && value !== null && value.$type === 'reference'){
		return value.label
	}
	if(Array.isArray(value)){
		const length = value.length;
		const array = [];
		for(let i=0;i<length;++i){
			array.push(locationAsText(location.child(i), options));
		}
		return array.join(', ');
	}
	if(spec.show){
		//generate a list of show properties 
		return '(' +
			spec.show.map(prop=>`${propTitle(location,prop)}: ${locationAsText(location.child(prop), options)}`)
	}
	
	if(['string','number','boolean'].includes(typeof value)){
		return JSON.stringify(value);
	}

	return options.replaceEmptyWithEllipsis? '...' : '';
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
	return text
		.replace(/  */g,' ')
		.replace(/ *,/g,',');
}

function processPattern(location, pattern, options){
	return pattern.split(',')
		.map((fragment, index)=>processFragment(location, fragment, index !== 0, options))
		.filter(item=>item !== null)
		.join(',')
}

function processFragment(location, pattern, nullIfEmpty, options){
	let hasEmpty = false;
	const ret = parsePattern(pattern).elements
	.map(el=>{
		if(typeof el === 'string'){
			return el;
		}else{
			if(isEmpty(location.child(el.name).value)){
				hasEmpty = true;
			}
			return locationAsText(location.child(el.name), options);
		}
	})
	.join('');
	return (hasEmpty && nullIfEmpty)? null : ret;
}

function isEmpty(x){
	return x === null || x === undefined
}