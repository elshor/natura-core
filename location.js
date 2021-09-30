/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {JsonPointer} from 'json-ptr'
import { specType, mergeSpec, specProperties } from './spec.js';
import {assume} from './error.js'
import calc, { isExpression, calcValue } from './calc.js';
import {entityType,entityValue,cloneEntity} from './entity.js'
import {patternText} from './pattern.js'
import {locationContext} from './context.js'
import Type from './type.js'
import langLib from './lang.js'
import { isValid } from './validate.js';
import Dictionary from './dictionary.js'
export function createLocation(data,dictionary=new Dictionary(),path=''){
	return new Location(data,dictionary,uriHash(path),null,uriResource(path));
}

class Location{
	constructor(data,dictionary,path,lang,uri){
		this.data = data;
		this.uri = uri
		this.dictionary = dictionary;
		this.path = path;
		this.lang = lang || langLib();
		this._children = {};
	}
	get value(){
		return locationValue(this);
	}

	/**
	 * @returns {Spec}
	 */
	get spec(){
		return locationSpec(this);
	}
	
	get valueType(){
		if(this.dictionary.isa(this.type,'expression')){
			return this.spec.valueType;
		}else{
			return this.type;
		}
	}

	get type(){
		if(this.isReference){
			//type is stored in the reference object
			return this.value.valueType;
		}else if(this.value && typeof this.value ==='object' && this.value.$type){
			//value is set with an object that has explicit type
			return this.value.$type;
		}
		const parent = this.parent;
		if(!parent){
			//no parent - return any
			return 'any'
		}else if(typeof this.value === 'string'){
			//TODO handle situations where expected type is a typedef of string
			return 'string';
		}else if(typeof this.value === 'number'){
			//TODO handle situations where expected type is a typedef of number
			return 'number';
		}else if(typeof this.value === 'boolean'){
			return 'boolean';
		}else if(Type(parent.type,location).isCollection){
			//this is a list type
			return Type(parent.type,location).singular;
		}else if(parent.spec.hashSpec){
			//this is a hashSpec
			return parent.spec.hashSpec.type;
		}else if(parent.spec.properties && parent.spec.properties[this.property]){
			return Type(parent.spec.properties[this.property].type,this).toString();
		}else{
			//no type information - return any
			return 'any'
		}
	}

	/**
	 * Get the spec of the entity type. If the type is an instance then return type of instance
	 */
	get valueSpec(){
		let type = this.type;
		const spec =  this.dictionary.getTypeSpec(type);
		if(spec.valueType){
			//this spec is probably an expression, the valueSpec is the spec of its valueType
			return this.dictionary.getTypeSpec(spec.valueType)
		}else{
			return spec;
		}
	}

	get expectedSpec(){
		if(this._expectedSpec){
			return this._expectedSpec;
		}
		this._expectedSpec = locationExpectedSpec(this);
		return this._expectedSpec;
	}
	get expectedType(){
		return calcValue(this.expectedSpec.type,this.context);
	}
	get parent(){
		const segments = JsonPointer.decode(this.path);
		if(segments.length > 0){
			segments.pop();
			const newPath = JsonPointer.create(segments).toString();
			return new Location(this.data,this.dictionary,newPath,this.lang);
		}else{
			return null;
		}
	}

	get previous(){
		const pathSegments = JsonPointer.decode(this.path);
		const last = pathSegments.pop();
		if(isNumber(last) && asNumber(last) > 0){
			return this.parent.child(Number(asNumber(last)-1).toString());
		}else{
			return null;
		}
	}

	get isReadOnly(){
		const spec = this.spec;
		if(!spec){
			return false;
		}else if(spec.value){
			return true;
		}else if(spec.readonly){
			return true;
		}else{
			return false;
		}
	}

	/**
	 * Return the default value at location based on spec's default value
	 */
	get default(){
		const expectedSpec = this.expectedSpec;
		return calc(expectedSpec.default,this.context);
	}
	/**
	 * get the path to the first required property that is empty
	 */
	firstMissingProperty(){
		if(this.isEmpty){
			if(this.spec.required){
				//the value is required but missing - return this path
				return '';
			}else{
				//if the value is empty and not required then finish search
				return null;
			}
		}
		const spec = this.spec;
		const properties = specProperties(spec);
		const keys = spec.show || Object.keys(properties);
		for(let i=0;i<keys.length;++i){
			const childPath = this.child(keys[i]).firstMissingProperty();
			if(childPath !== null){
				return keys[i] + (childPath.length > 0 ? '/' + childPath : '');
			}
		}
		return null;
	}

	/**
	 * the static context to pass to a spec function at a certain location. This function returns execution at edit time, not execution time. It is used to calculate spec proeprties
	 */
	get context(){
		return locationContext(this);
	}

	/**
	 * ContextNoSearch is a context object used for calculation that does not search context for properties. This can be used when we want to prevent recursion when calculating context or when performance is important and there is no need for context search
	 */
	get contextNoSearch(){
		return locationContext(this,{});
	}
		
	get property(){
		return JsonPointer.decode(this.path).pop();
	}
	
	get patternText(){
		return patternText(this);
	}

	get isReference(){
		function isSelfReference(location){
			//self reference is a reference to itself. This should not be considered a reference because it will cause endless recursion
			return (!location.data.path || location.data.path === '') && 
				location.data.$type === 'reference'
		}
		return specType(this.spec) === 'reference' && !isSelfReference(this);
	}

	/**
	 * Check if location value is empty i.e. equals undefined or null
	 */
	get isEmpty(){
		const value = this.value;
		return value === undefined || value === null;
	}
	/**
	 * If the valut at this location is a reference then return the location object for the entity referenced. Otherwise, just return this
	 * @returns {Location}
	 */
	get referenced(){
		if(this.isReference){
			const ret = createLocation(
				getResource(this.value.path||'',this,this.data),
				this.dictionary,
				uriHash(this.value.path)
			);
			return ret;
		}else{
			return this;
		}
	}
	/**
	 *
	 * @param {String} prop
	 * @returns {Location}
	 */
	child(prop){
		if(this._children[prop]){
			return this._children[prop];
		}
		const child = new LocationChild(this,prop);
		this._children[prop] = child;
		return child;
	}

	/**
	 * Check if a value is valid at this location
	 */
	isValid(value){
		return isValid(this,value);
	}

	/**
	 * is true if the current value is valid at this location
	 */
	get valid(){
		return isValid(this,this.value) === true;
	}

	get children(){
		const val = this.value;
		if(val === null || typeof val !== 'object'){
			return [];
		}
		return Object.keys(val).map(key=>this.child(key));
	}
	
	get properties(){
		const val = this.value;
		if(val === null || typeof val !== 'object'){
			return [];
		}
		const ret = {};
		Object.keys(val).forEach(key=>ret[key] = this.child(key));
		return ret;
	}

	/**
	 * Returns an array of locations of prop. If prop is an array then returns an array of locations of all its items. If value of property is not an array then returns an array with only that location
	 * @param {String} prop
	 * @returns {Array}
	 */
	childList(prop){
		const val = this.child(prop).value;
		if(Array.isArray(val)){
			return val.map((item,index)=>this.child(prop).child(index));
		}else{
			return [this.child(prop)];
		}
	}
	sibling(prop){
		return this.parent.child(prop);
	}

	get isLocation(){
		return true;
	}
	
	/**
	 * Delete the value at the path. If the path points to an item in an array then the function uses splice to remove the element
	 */
	delete(){
		const parentValue = this.parent.value;
		if(Array.isArray(parentValue)){
			//ensure property is a number
			const pos = typeof this.property === 'number'? 
				this.property : 
				Number.parseInt(this.property,10);
			if(Number.isNaN(pos) || pos < 0){
				throw new TypeError('Array index should be a positive integer');
			}
			parentValue.splice(pos,1);
		}else{
			delete parentValue[this.property];
		}
	}

	/**
	 * set the value at the location. If the path to the location does not exist then create it. If the location property has format `#key` then assume the parent is an array (if doesn't exist) and create a new object with key set. If the property is a number then assume it is a position within an array. If the property is -1 then insert a new item to the array
	 * @param {*} value value to set
	 * @param {Function} setter a function to be used to set the property value of an object. This should be used in situations like Vue reactive data where setting needs to make sure the object is reactive
	 */
	set(value,setter=plainSetter){
		const property = this.property;
		const isHash =  (property.charAt(0) === '#');
		const parent = this.parent;
		const asInteger = Number.parseInt(property,10);
		if(!parent.value){
			//first set the value of parent
			if(isHash || !Number.isNaN(asInteger)){
				//if the property is a hash or number then assuming the parent is an array
				this.parent.set([],setter);
			}else{
				this.parent.set({},setter);
			}
		}
		if(isHash){
			//need to insert an object to the array. value must be an array
			const parentValue = parent.value;
			const hashKey = property.substr(1);
			if(!Array.isArray(parentValue)){
				throw new TypeError(`parent of hash value must be an array`);
			}
			if(value === null || typeof value !== 'object'){
				throw new TypeError(`insert at hash property must be an object`);
			}

			//look for the hash object
			let index = -1;
			for(let i=0;i<parentValue.length;++i){
				if(this.child(i).key === hashKey){
					this.parent.child(i).set(value,setter);
					index = i;
				}
			}
			if(index === -1){
				//push value at the end
				index = parentValue.length;
				setter(parentValue,parentValue.length,value);
			}

			//now set the key so it will be returned by the hash property
			const created = this.parent.child(index);
			const keyProperty = created.spec.key || "$key";
			setter(created.value,keyProperty, hashKey);;
		}else if(asInteger === -1 && Array.isArray(this.parent.value)){
			//insert a new item into array
			console.log('inserting a new item to path',this.path);
			this.parent.value.push(value);
		}else{
			setter(parent.value,property,value);
		}
	}

	/**
	 * If $parent is an array and property is a number then insert value into location using splice function. Otherwise, just set it
	 * @param {*} value value to insert
	 * @param {Function} setter setter function to use for setting values. Use this for special setting handling like for ractive objects in Vue
	 * @param {Function} inserter inserter function to use. This should be used when special insert handling is required such as handling reactivity in Vue
	 */
	insert(value,setter=plainSetter,inserter=plainInserter){
		const parent = this.parent.value;
		const key = this.property
		if(Array.isArray(parent)){
			const pos = typeof key === 'number'? key : Number.parseInt(key,10);
			if(Number.isNaN(pos)){
				setter(parent,key,value)
			}else{
				inserter(parent,pos,value)
			}
		}else{
			setter(parent,key,value)
		}	
	}
}


/**
 * Find the spec associated with a specific location. The spec is calculated as follows:
 * If the location has a $type property, then merge it with expected spec, otherwise  return expectedSpec
 * @param {Location} location
 */
function locationSpec(location){
	assume(location);
	const expectedSpec = location.expectedSpec;
	let actualSpec = {};
	let value = undefined;
	value = location.value;
	if(entityType(value) ==='object' && value !== null && value.$type){
		//use explicit type
		actualSpec = location.dictionary.getTypeSpec(Type(value.$type,location));
	}else if(specType(expectedSpec) === 'any' && value !== undefined){
		//there is no expected spec - try to deduce it from actual value
		const type = entityType(value);
		if(type === 'string'){
			actualSpec = {type:'string'};
		}else if(type === 'number'){
			actualSpec = {type:'number'};
		}else if(type === 'boolean'){
			actualSpec = {type:'boolean'};
		}
	}
	return mergeSpec(expectedSpec,actualSpec);
}

/**
 * returns the value pointed by the location. This function checks the spec if there are any properties that have a `value` or `default` property and generates property if needed. For properties with `value` defined it always generates the property value and for properties with `default` defined it only generates a property value if the property value is `undefined`
 * @param {Location} location
 */
function locationValue(location){
	if(location.path === undefined || location.path === ''){
		return location.data;
	}
	const parent = location.parent;
	if(!parent){
		return undefined;
	}
	const parentValue = location.parent.value;
	if(!parentValue){
		return undefined;
	}
	const property = location.property;
	if(typeof property === 'string' && property.charAt(0) === '#'){
		//this is a hash property. Look for the first child of parent that its key matches the has key
		const hashKey = property.substr(1);
		for(let x in parentValue){
			if(parent.child(x).key === hashKey){
				return parent.child(x).value;
			}
		}
		return undefined;
	}

	const value = parentValue[property];
	if(value !== undefined){
		return value;
	}
	//check for default value
	const spec = location.expectedSpec;
	if(spec.default !== undefined){
		if(isExpression(spec.default)){
			return cloneEntity(calc(spec.default, location.context));;
		}else{
			return cloneEntity(spec.default);
		}
	}
}

/**
 * returns the location spec as defined in its parent spec.
 * @param {Location} location
 */
function locationExpectedSpec(location){
	const parent = location.parent;
	if(!parent){
		//top level - we have no information regarding the spec
		return {type:'any'};
	}
	const parentSpec = locationSpec(parent) || {type:'any'};
	if(Type(specType(parentSpec),location).isCollection){
		//its parent is an array
		const childSpec = parentSpec.childSpec || {};
		childSpec.type = childSpec.type || Type(specType(parentSpec),location).singular;
		childSpec.placeholder = childSpec.placeholder || parentSpec.placeholder;
		childSpec.description = childSpec.description || parentSpec.description;
		return mergeSpec(
			childSpec,
			location.dictionary.getTypeSpec(Type(specType(parentSpec),location).singular)
		);
	}else if(parentSpec.hashSpec){
		return mergeSpec(
			parentSpec.hashSpec,
			location.dictionary.getTypeSpec(Type(parentSpec.hashSpec.type,location))
		);
	}else{
		const pathSegments = JsonPointer.decode(location.path);
		const propertyName = pathSegments.pop();
		const parentProperties = specProperties(parentSpec,location.dictionary);
		if(parentProperties && parentProperties[propertyName]){
			const propertySpec = parentProperties[propertyName] || {};
			const typeSpec = location.dictionary.getTypeSpec(Type(propertySpec.type,location));
			return mergeSpec(typeSpec,propertySpec);
		}else{
			return {type:'any'};
		}
	}
}

function isNumber(n){
	return asNumber(n) !== null;
}

function asNumber(n){
	n = entityValue(n);
	if(typeof n === 'number'){
		return n;
	}else if(typeof n === 'string' && !Number.isNaN(Number.parseFloat(n))){
		return Number.parseFloat(n);
	}else{
		return null;
	}
}

class LocationChild extends Location{
	constructor(parent,property){
		super(parent.data,parent.dictionary,parent.path+'/'+property,parent.lang,parent.uri);
		this._parent = parent;
		this._property = property;
	}
	get parent(){
		return this._parent;
	}
	get property(){
		return this._property;
	}
	
	get key(){
		const keyProperty = this.spec.key || '$key';
		return this.child(keyProperty).value;
	}
}

function uriHash(uri){
	try{
		const hash = new URL(uri).hash.substr(1);
		if(hash[0]!=='/'){
			return '/' + hash;
		}else{
			return hash;
		}
	}catch{
		return uri;
	}
}

function uriResource(uri){
	try{
		const hash =  new URL(uri).hash || '';
		return uri.substr(0,uri.length-hash.length)
	}catch{
		return null;
	}
}

function getResource(uri,location,defaultData){
	const parsed = uri.match(/^dictionary\:([^\#]+)(.*)?$/);
	if(parsed){
		//the location references an instance from the dictionary
		const ret = location.dictionary.getInstanceByID(parsed[1]);
		return ret;
	}else{
		return defaultData;
	}
}

function plainSetter(obj,key,value){
	obj[key]=value;
}

function plainInserter(arr,pos,value){
	arr.splice(pos,0,value);
}
