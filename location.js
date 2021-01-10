import {JsonPointer} from 'json-ptr'
import { specType, mergeSpec, specProperties } from './spec';
import {assume} from './error'
import calc, { isExpression, calcValue } from './calc';
import {entityType,entityValue} from './entity'
import i18n from 'src/i18n';
import {patternText} from './pattern'
import Type from './type'

export function createLocation(data,dictionary=new Dictionary(),path=''){
	return new Location(data,dictionary,uriHash(path),i18n(),uriResource(path));
}

class Location{
	constructor(data,dictionary,path,lang,uri){
		this.data = data;
		this.uri = uri
		this.dictionary = dictionary;
		this.path = path;
		this.lang = lang;
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
			return this.value.type;
		}else if(this.value && typeof this.value ==='object' && this.value.$type){
			//value is set with an object that has explicit type
			return this.value.$type;
		}
		const parent = this.parent;
		if(!parent){
			//no parent - return any
			return 'any'
		}else if(Type(parent.type,location).isCollection){
			//this is a list type
			return Type(parent.type,location).singular;
		}else if(parent.spec.hashSpec){
			//this is a hashSpec
			return parent.spec.hashSpec.type;
		}else{
			//no type information - return any
			return 'any'
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
	
	get entity(){
		return locationEntity(this);
	}
	
	get property(){
		return JsonPointer.decode(this.path).pop();
	}
	
	get patternText(){
		return patternText(this);
	}

	get isReference(){
		return specType(this.spec) === 'reference'
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
			return createLocation(
				getResource(this.value.path,this) || this.data,
				this.dictionary,
				this.value.path
			);
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

	get children(){
		const val = this.value;
		if(val === null || typeof val !== 'object'){
			return [];
		}
		return Object.keys(val).map(key=>this.child(key));
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
	
	/**
	 * set the value at the location
	 * @param {*} value value to set
	 */
	set(value){
		const property = this.property;
		const parent = this.parent;
		if(!parent){
			throw new TypeError(`location top value cannot be set`);
		}
		parent.value[property] = value;
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
	try{
		value = JsonPointer.get(location.data,location.path);
	}catch(e){
	}
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
	const property = location.property;
	if(property === undefined){
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
	const value = parentValue[property];
	if(value !== undefined){
		return value;
	}
	//check for default value
	const spec = location.expectedSpec;
	if(spec.default !== undefined){
		if(isExpression(spec.default)){
			return calc(spec.default, location.context);;
		}else{
			return spec.default;
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
		childSpec.type = childSpec.type || itemType(specType(parentSpec));
		return mergeSpec(
			childSpec,
			location.dictionary.getTypeSpec(Type(itemType(specType(parentSpec)),this))
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

function itemType(type){
	return type.match(/^(.+)\*$/)[1];
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

function locationContext(location){
	return Object.assign(
		{},{$location:location,location}
	);
}

function locationEntity(location){
	return new Proxy(location,{
		get: function(location,prop){
			if(typeof prop === 'symbol'){
				//props can only be strings so pass it on to raw object
				return location.value[prop];
			}
			if(prop === '$spec'){
				return location.spec;
			}
			if(prop === '$value'){
				return location.value;
			}
			if(prop === '$raw'){
				return locationRawValue(location);
			}
			if(prop === '$isProxy'){
				return true;
			}
			if(prop === '$parent'){
				return location.parent.entity;
			}
			const value = location.child(prop).value;
			if(typeof value === 'object' && value !== null){
				//value is an object. Return its entity proxy
				return location.child(prop).entity;
			}else{
				return value;
			}
		},
		set(location,prop,value){
			const thisObject = location.value;
			if(typeof thisObject === 'object' && thisObject !== null){
				const spec = location.child(prop).spec;
				if(spec.value === undefined && spec.readonly !== true){
					//value not defined in spec and property is not readonly
					thisObject[prop] = value;
				}else{
					throw new TypeError(`property ${prop} is read only`);
				}
			}
			return true;
		},
		enumerate(){
			throw new Error('Not Implemented enumerate');
		},
		ownKeys(location){
			//get thisObject keys. If spec has additional properties then add it to the list
			const thisObject = location.value;
			const spec = location.spec;
			const ret = Reflect.ownKeys(thisObject);
			const properties = specProperties(spec,location.dictionary);
			if(typeof properties === 'object'){
				Object.keys(properties).forEach(prop=>{
					if(!ret.includes(prop)){
						ret.push(prop);
					}
				});
			}
			return ret;
		},
		has(location,key){
			const thisObject = location.value;
			return Reflect.has(thisObject,key);
		},
		defineProperty(){
			throw new Error('Not Implemented');
		},
		getOwnPropertyDescriptor(location,key){
			const thisObject = location.value;
			return Reflect.getOwnPropertyDescriptor(thisObject,key);
		},
		deleteProperty(){
			throw new Error('Not Implemented deleteProperty');
		}
	})
}

/**
 * convert the location value to raw JSON - calculating default and value properties
 * @param {Location} location
 */
function locationRawValue(location){
	const value = location.value;
	if(typeof value !== 'object'){
		return value;
	}else if(value === null){
		return null;
	}else if(Array.isArray(value)){
		//value is an array
		return value.map(
			(item,index)=>locationRawValue(location.child(index)));
	}else{
		//get object own keys
		const props = Object.keys(value);

		//add properties that are defined in the spec but are not in keys
		const properties = specProperties(
			location.spec,
			location.dictionary
		) || [];
		Object.keys(properties).forEach(prop=>{
			if(!props.includes(prop)){
				props.push(prop);
			}
		});

		//generate ret object
		const ret = {};
		props.forEach(
			prop=>ret[prop] = locationRawValue(location.child(prop)));
		return ret;
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
}

function uriHash(uri){
	try{
		const hash = new URL(uri).hash;
		if(hash[0]==='#' && hash[1]!=='/'){
			return '#/' + hash.substr(1);
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

function getResource(uri,location){
	const parsed = uri.match(/^dictionary\:\/\/([^\#]+)(.*)?$/);
	if(parsed){
		//the location references an instance from the dictionary
		return location.dictionary.getInstanceByID(parsed[1]);
	}else{
		return null;
	}
}
