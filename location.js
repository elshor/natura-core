/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {JsonPointer} from 'json-ptr'
import { mergeSpec, specProperties, Spec } from './spec.js';
import calc, { isExpression, calcValue } from './calc.js';
import {entityValue,cloneEntity, generateNewEntity} from './entity.js'
import {patternText} from './pattern.js'
import {locationContext} from './context.js'
import Type from './type.js'
import langLib from './lang.js'
import { isValid } from './validate.js';
import Dictionary from './dictionary.js'
import { calcTemplate } from './template.js';
import locationQuery from './location-query.js'
import { assume } from './error.js';
const locationMap = new Map();
export function createLocation(data,dictionary=new Dictionary(),path=''){
	const segments = JsonPointer.decode(uriHash(path));
	let top;
	if(locationMap.has(data)){
		//if a location was already generated for this data then return it. We want to make sure, each data has only a single location so we don't get into situation where two location represetns a single data point, one location is updated and the other doesn't know about it
		//we assume for a single data object there can only be one URI and one dictionary
		top = locationMap.get(data);
	}else{
		top = new Location(data,dictionary,'',null,uriResource(path));
		locationMap.set(data,top);
	}

	let current = top;
	for(let i=0;i<segments.length;++i){
		current = current.child(segments[i]);
	}
	return current;
}
class Location{
	constructor(data,dictionary,path,lang,uri){
		this.data = data;
		this.uri = uri
		this.dictionary = dictionary;
		this.path = path;
		this.lang = lang || langLib();
		this._cache = {};
		this._children = {};
		this._listeners=[];
		this._sversion = 0;//structure version - used to invalidate nodes that changed
	}
	addEventListener(listener){
		this._listeners.push(listener);
	}
	removeEventListener(listener){
		const index = this._listeners.indexOf(listener);
		if(index >=0){
			this._listeners.splice(index,1);
		}
	}
	emitChange(location,action){
		this._listeners.forEach(l=>l({location,action}));
	}
	_invalidateCache(){
		if(this._cache.hasCachedValue){
			if(!this.parent.value){
			}else if(this.parent.value[this.property]!== this._cache.value){
			}
		}
		Object.values(this._children).forEach(
			child=>child._invalidateCache({self:true})
		)
		this._cache = {};
	}
	get value(){
		if(this._cache.hasCachedValue){
			return this._cache.value;
		}else{
			const ret = locationValue(this);
			this._cache.value = ret;
			this._cache.hasCachedValue = true;
			return ret;
		}
	}

	/**
	 * @returns {Spec}
	 */
	get spec(){
		const typeSpec = this.dictionary.getTypeSpec(this.type);
		const contextSpec = this.contextSpec;
		return mergeSpec(contextSpec,typeSpec);
	}
	
	get contextSpec(){
		const parent = this.parent;
		let ret;
		if(!parent){
			//top level - we have no information regarding the spec
			return {};
		}
		const parentType = parent.type;
		if(
			this._cache.parentType &&
			this._cache.parentType.toString() === parentType.toString() && 
			this._cache.contextSpec
		){
			//parent did not change and can use cache
			return this._cache.contextSpec;
		}
		if(parentType.isCollection){
			//its parent is an array
			const parentSpec = parent.contextSpec;
			const childSpec = parentSpec.childSpec || 
				Object.assign({},parentSpec,{type:Type(parentSpec.type,this).singular});
			childSpec.type = childSpec.type || Type(parentSpec.type,this).singular;
			ret = childSpec;
		}else{
			const parentSpec = parent.contextSpec;
			if(parentSpec && typeof parentSpec === 'object' && parentSpec.hashSpec){
				ret = parentSpec.hashSpec;
			}else{
				const parentTypeSpec = this.dictionary.getTypeSpec(parentType);
				ret = specProperties(parentTypeSpec)[this.property];
			}
		}

		//store cache
		this._cache.parentType = parentType;
		this._cache.contextSpec = ret;
		return ret || {};
	}

	get valueType(){
		if(this.dictionary.isa(this.type,'expression')){
			return Type(this.spec.valueType,this);
		}else{
			return this.type;
		}
	}

	get valueTypeSpec(){
		const valueType = this.spec.valueType || this.type;
		return Spec(this.dictionary.getTypeSpec(valueType),this.dictionary);
	}

	get type(){
		if(!this._cache.type){
			this._cache.type = this.calcType();			
		}
		return this._cache.type;
	}
	calcType(){
		const thisValue = this.value;
		if(this._isReference(thisValue)){
			//type is stored in the reference object
			return Type(thisValue.valueType,this);
		}else if(thisValue && typeof thisValue ==='object' && thisValue.$type){
			//value is set with an object that has explicit type
			return Type(thisValue.$type,this);
		}
		const parent = this.parent;

		if(typeof thisValue === 'string'){
			//TODO handle situations where expected type is a typedef of string
			return Type('string',this);
		}else if(typeof thisValue === 'number'){
			//TODO handle situations where expected type is a typedef of number
			return Type('number',this);
		}else if(typeof thisValue === 'boolean'){
			return Type('boolean',this);
		}

		if(this._cache.parentType === undefined){
			this._cache.parentType = parent? parent.type : 'any';
		}

		if(Type(this._cache.parentType,this).isCollection){
			//this is a list type
			return Type(this._cache.parentType,this).singular;
		}

		if(this._cache.parentSpec === undefined){
			this._cache.parentSpec = parent? parent.spec : {};
		}
		if(this._cache.parentSpec.hashSpec){
			//this is a hashSpec
			return Type(this._cache.parentSpec.hashSpec.type,this);
		}else if(
			this._cache.parentSpec.properties && 
			this._cache.parentSpec.properties[this.property]
		){
			return Type(this._cache.parentSpec.properties[this.property].type,this);
		}else{
			//no type information - return any
			return Type('any',this);
		}
	}

	/**
	 * Get the spec of the entity type. If the type is an instance then return type of instance
	 */
	get valueSpec(){
		const spec = this.spec;
		if(spec.valueType){
			//this spec is probably an expression, the valueSpec is the spec of its valueType
			return this.dictionary.getTypeSpec(Type(spec.valueType,this))
		}else{
			return spec;
		}
	}

	get inlineTitle(){
		const spec = this.spec;
		if(spec.template){
			return calcTemplate(this.spec.template,this.contextNoSearch);
		}
		const patternText = this.patternText;
		if(patternText){
			return patternText;
		}
		if(spec.title){
			return calcTemplate(spec.title,this.contextNoSearch);
		}
		return spec.name || spec.type.toString();
	}

	get expectedSpec(){
		const typeSpec = this.dictionary.getTypeSpec(this.expectedType);
		const contextSpec = this.contextSpec;
		return mergeSpec(contextSpec,typeSpec);
	}

	get expectedType(){
		const parent = this.parent;
		if(!parent){
			//no parent - return any
			return Type('any',this)
		}else if(parent.type.isCollection){
			//this is a list type
			return parent.type.singular;
		}else if(parent.spec.hashSpec){
			//this is a hashSpec
			return Type(parent.spec.hashSpec.type,this);
		}else if(parent.spec.properties && parent.spec.properties[this.property]){
			return Type(parent.spec.properties[this.property].type,this);
		}else{
			//no type information - return any
			return Type('any',this);
		}
	}

	get parent(){
		if(this._parent !== undefined){
			return this._parent;
		}
		const segments = JsonPointer.decode(this.path);
		if(segments.length > 0){
			segments.pop();
			const newPath = JsonPointer.create(segments).toString();
			this._parent =  new Location(this.data,this.dictionary,newPath,this.lang);
			return this._parent;
		}else{
			this._parent = null;
			return null;
		}
	}

	get previous(){
		const pathSegments = JsonPointer.decode(this.path);
		const last = pathSegments.pop();
		if(isNumber(last) && asNumber(last) > 0){
			return this.parent.child(Number(asNumber(last)-1).toString());
		}else if(asNumber(last) === -1){
			const parentValue = this.parent.value;
			if(Array.isArray(parentValue) && parentValue.length > 0){
				return this.parent.child(parentValue.length-1);
			}else{
				return null;
			}
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
		if(this._property === undefined){
			this._property = JsonPointer.decode(this.path).pop();
		}
		return this._property;
	}
	
	get patternText(){
		return patternText(this);
	}

	get isReference(){
		return this._isReference();
	}

	_isReference(currentValue = undefined){
		function isSelfReference(location){
			//self reference is a reference to itself. This should not be considered a reference because it will cause endless recursion
			return location && location.data && location.data.$type === 'reference' &&
			(!location.data.path || location.data.path === '')
		}
		if(isSelfReference(this)){
			return false;
		}
		const value = (currentValue === undefined? this.value : currentValue);
		return value && typeof value === 'object' && value.$type==='reference';
	}

	/**
	 * Check if location value is empty i.e. equals undefined or null
	 */
	get isEmpty(){
		const value = this.value;
		return value === undefined || value === null;
	}

	/**
	 * Value is true if this type is an array (collection type) or hashType
	 * @returns {Boolean}
	 */
	get isCollection(){
		return Type(this.type,this).isCollection || this.spec.hashSpec;
	}
	
	/**
	 * If the valut at this location is a reference then return the location object for the entity referenced. Otherwise, just return this
	 * @returns {Location}
	 */
	get referenced(){
		if(this.isReference && this.value.path !== undefined){
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
		//TODO what happens when value changes - need to invalidate (unless vue reactivity takes care of that - need to test)
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
			this.parent._invalidateCache({fron:pos});
		}else{
			delete parentValue[this.property];
			this._invalidateCache({self:true})
		}
		this.parent.emitChange(this,'delete-child');
	}
	/** validate  value cache is correct*/
	_dbValidate(){
		if(this._cache.hasCachedValue && this._cache.value !== locationValue(this)){
			console.error('failed validation',this.path,this._cache.value,locationValue(this));
		}
		if(this.parent){
			this.parent.validate();
		}
	}
	/**
	 * set the value at the location. If the path to the location does not exist then create it. If the location property has format `#key` then assume the parent is an array (if doesn't exist) and create a new object with key set. If the property is a number then assume it is a position within an array. If the property is -1 then insert a new item to the array
	 * @param {*} value value to set
	 * @param {Function} setter a function to be used to set the property value of an object. This should be used in situations like Vue reactive data where setting needs to make sure the object is reactive
	 * @returns {Location} the new location. This is different from original location when path is a hash or -1 index
	 */
	set(value,setter=plainSetter){
		const property = this.property;
		const isHash =  (typeof property === 'string' && property.charAt(0) === '#');
		const parent = this.parent;
		const asInteger = Number.parseInt(property,10);
		const currentValue = this.value;
		//if value is the same then do nothing
		if(currentValue === value){
			return this;
		}
		if(asInteger === -1 && Array.isArray(this.parent.value)){
			//need to invalidate the location at the expected insert position
			this.parent.child(this.parent.value.length)._invalidateCache({self:true});
		}

		if(!parent.value){
			//first set the value of parent
			if(isHash || !Number.isNaN(asInteger)){
				//if the property is a hash or number then assuming the parent is an array
				this.parent.set([],setter);
			}else{
				this.parent._setNew(setter);
			}
		}
		if(isHash){
			//need to insert an object to the array. value must be an array
			const parentValue = parent.value;
			const hashKey = property.substring(1);
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
					this.parent.child(i.toString()).set(value,setter);
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
			setter(created.value,keyProperty, hashKey);
			this._invalidateCache({self:true});
			this.emitChange(this,'set');//changed this value
			this.parent.emitChange(this,'set-child');//parent value changed
		return created;
		}else if(asInteger === -1 && Array.isArray(this.parent.value)){
			//insert a new item into array
			const parentValue = this.parent.value;
			parentValue.push(value);
			this._invalidateCache({self:true});
			this.emitChange(this,'set');//changed this value
			this.parent.emitChange(this,'set-child');//parent value changed
		return this.parent.child((parentValue.length-1).toString());
		}else{
			//set this path
			setter(parent.value,property,value);

			//invalidate cache
			this._invalidateCache();
	
			this.emitChange(this,'set');//changed this value
			this.parent.emitChange(this,'set-child');//parent value changed
			return this;
		}
	}

	/** set a new object. If expectedType is not any then generateNewEntity of that type */
	_setNew(setter=plainSetter){
		const type = this.expectedType;
		if(type.toString() === 'any'){
			return this.set({},setter);
		}
		if(type.isCollection){
			return this.set([],setter);
		}
		return this.set(generateNewEntity(this),setter)
	}

	/**
	 * If $parent is an array and property is a number then insert value into location using splice function. Otherwise, just set it
	 * @param {*} value value to insert
	 * @param {Function} setter setter function to use for setting values. Use this for special setting handling like for ractive objects in Vue
	 * @param {Function} inserter inserter function to use. This should be used when special insert handling is required such as handling reactivity in Vue
	 */
	insert(value,setter=plainSetter,inserter=plainInserter){
		let parent = this.parent.value;
		const key = this.property;
		const pos = (typeof key === 'number')? key : Number.parseInt(key,10);

		if(parent === undefined){
			//need to generate parent
			if(Number.isNaN(pos) && pos[0] !== '#'){
				//parent is a regular object
				this.parent._setNew(setter);
			}else{
				this.parent.set([]);
			}
			parent = this.parent.value;
		}
		if(Array.isArray(parent)){
			if(Number.isNaN(pos)){
				//this is not really a pos in an array
				throw new Error('Insert position is not an array index');
			}else{
				inserter(parent,pos,value);
				this.parent.emitChange(this,'insert-child');
				this.emitChange(this,'set');
				this.parent._invalidateCache({from:pos})
			}
		}else{
			//this is not an array pos - treat it as a property
			setter(parent,key,value);
			this.parent.emitChange(this,'set-child');
			this.emitChange(this,'set');
			this._invalidateCache({self:true});
		}
	}
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
	if(location._cache.parentValue === undefined){
		location._cache.parentValue = location.parent.value;
	}
	const parentValue = location._cache.parentValue;
	if(!parentValue){
		return undefined;
	}
	const property = location.property;
	if(typeof property === 'string' && property.charAt(0) === '#'){
		//this is a hash property. Look for the first child of parent that its key matches the has key
		const hashKey = property.substring(1);
		for(let x in parentValue){
			if(parent.child(x).key === hashKey){
				return parent.child(x).value;
			}
		}
		return undefined;
	}

	const value = parentValue[property];
	return value;
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

export function relativeLocations(location,path){
	return locationQuery(location,path);
}


class ShadowLocation extends LocationChild{
	constructor(baseLocation,value){
		super(baseLocation.parent,baseLocation.property);
		this._value = value;
	}
	get value(){
		return this._value;
	}
	delete(){
		throw new Error('Cannot delete a shadow location')
	}
	set(){
		throw new Error('Cannot set a shadow location')
	}
	insert(){
		throw new Error('Cannot insert at a shadow location')
	}
}

export function relativeLocation(location,path){
	const locations = locationQuery(location,path);
	if(locations.length === 0){
		//no locations found
		return null;
	}
	return locations[0];
}


/**
 * Create a shadow location.. A shadow location is a location that is disconnected from the actual data tree. It cannot be approached from its parent. Its value cannot change. It is used to evaluate context and suggestions of possible values before the values are actually set. E.g. check validity of values and suggestions assuming the value is empty 
 */
 export function shadowLocation(baseLocation,value){
	return new ShadowLocation(baseLocation,value);
}