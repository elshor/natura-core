/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import calc,{ isExpression } from './calc.js';
import Type from './type.js'
const DefaultPlaceholder = 'Enter value here';

export function specType(spec){
	return spec? (spec.name || Type(spec.type) || specComputedPattern(spec)) : 'any';
}

export function specContextType(spec){
	return spec? (spec.contextType || spec.name || spec.type || specComputedPattern(spec)) : 'any';
}

export function specIsa(spec,className){
	return (spec.isa || []).includes(className);
}

export function specComputedPattern(spec){
	if(isExpression(spec.displayPattern)){
		return calc(spec.displayPattern,spec);
	}
	return spec.displayPattern || spec.pattern;
}

export function specID(spec){
	return spec.$id || specType(spec);
}

export function specHasProperties(spec){
	if(!spec || !spec.properties){
		return false;
	}
	return Object.keys(spec.properties).length > 0;
}



export function placeholder(spec,propertyName){
	if(!spec){
		return DefaultPlaceholder;
	}
	return spec.placeholder ||
		spec.title ||
		propertyName ||
		specType(spec).searchString ||
		DefaultPlaceholder
}
const DEFAULT_SPEC = [{$type:'use context',path:'..'}];
/**
 * Merge a context spec, determined by the property definition, and the type spec of a certain location
 * @param {Spec} contextSpec the spec determined by the context of the location, as defined in the properties spec
 * @param {Spec} typeSpec the spec stored in the dictionary retrieved using getTypeSpec
 * @returns {Spec}
 */
export function mergeSpec(contextSpec, typeSpec){
	contextSpec = contextSpec || {};
	typeSpec = typeSpec || {};
	const ret = Object.assign({},typeSpec||{},contextSpec||{});
	//context is only defined in property spec
	ret.context = [
		...(typeSpec.context||[]),
		...(contextSpec.context || DEFAULT_SPEC)
	];
	if(typeSpec.scope && contextSpec.scope){
		//TODO need to merge scopes
	}else{
		ret.scope = contextSpec.scope || typeSpec.scope;
	}
	
	return ret;

}

export function computeSpecProperty(spec,location, name,defaultValue){
	let value = spec[name];
	if(isExpression(value)){
		value = calc(value,{$spec:spec,$location:location});
	}
	return value === undefined? defaultValue : value;
}


export function specProperties(spec){
	return spec.properties || {};
}

/**
 * Return true if this spec is a selection of options and not a primitive value
 * @param {Spec} spec
 */
export function specIsSelection(spec){
	return spec.options !== undefined && spec.options !== null;
}

export function specIsGeneric(spec){
	return Array.isArray(spec.genericProperties) && !spec.$specialized;
}