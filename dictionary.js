/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { LoadError, assume, ParamValue } from "./error.js";
import { specType,isSpecGeneric } from "./spec.js";
import { parsePattern } from "./pattern.js";
import Type from './type.js';
import {entityType,entityIsArray} from './entity.js'
import deepmerge from "deepmerge";
import base from './packages/base.js'
import reference from "./reference.js";
import { calcTemplate } from "./template.js";
import { matchRole,Role } from "./role.js";
import { Parser } from "./parser.js";
import {suggestCompletion, suggestTokens} from './suggest.js'
import { loadPackage } from "./loader.js";
import registerPackage from "./register-package.js";
import Logger from './logger.js'

export default class Dictionary{
	constructor(packages=[base], logger){
		assume(entityIsArray(packages),'packages should be an array. It is '+JSON.stringify(packages));
		this.packages = packages;
		this.logger = logger || new Logger(console, 'error');
		this.reset();
		this.resetVersion();
	}
	error(...args){
		this.logger.error(...args);
	}
	reset(){
		//clear old data
		this.initiated = true;
		this.repo = {};
		this.isaRepo = {};
		this.valueTypeRepo = {};
		this.collectionRepo = [];
		this.instances = {};
		this.instancesByType = {};
		this.functions = {};
		this.parser = new Parser(this);

		//initialization registerations
		this._registerType('entity definition group',{isa:['definition group']});
		this._registerIsa('definition group','entity definition group')
		this._registerIsa('definition group','property definition group')
		this._registerIsa('definition group','event definition group')
		this._registerIsa('definition group','expression definition group')
		this._registerIsa('definition group','action definition group') 
	}

	isInitiated(){
		return this.initiated === true;
	}

	isTypeGeneric(type){
		const spec = this.getTypeSpec(type);
		return isSpecGeneric(spec);
	}

	isa(type,className){
		if(className.isa){
			return className.isa(this,type);
		}
		type = searchString(type);
		className = searchString(className);

		if(type === className){
			//a class is always itself - e.g. an action is an action
			return true;
		}
		if(!type){
			return false;
		}
		if(className === 'any'){
			return true;
		}
		if(type === '?'){
			return true;
		}
		
		this._ensureSpecializedIsRegistered(type);
		
		if((this.isaRepo[className]||[]).includes(type)){
			return true;
		}
		const {specialized,generic} = getSpecializedType(type);
		
		if(!generic){
			return false;
		}

		//check generics
		if(generic === className.toString()){
			//class includes all specializations of generic
			return true;
		}
		const specializedClass = getSpecializedType(className);
		if(generic === specializedClass.generic){
			//class and type are both specializations of generic
			//NOTE we reverse here className and type looking for
			//className.specialized isa type.specialized
			return this.isa(specializedClass.specialized,specialized);
		}
		return false;
	}

	resetVersion(){
		this.version = ''+(Number(new Date()) - new Date('2020-01-01')+Math.random()).toString(36).replace('.','');
	}

	/**
	 * Initial load of packages to the dictionary. This must be called before the dictionary is used
	 */
	async load(dynamicPackages){
		return await this.reload(dynamicPackages);
	}

	/**
	 * Reload the packages. This should be called when the packages are changed and need to be reprocessed. All packages are reloaded. In addition, dynamicPackages are also loaded
	 */
	async reload(dynamicPackages=[]){
		dynamicPackages =	entityIsArray(dynamicPackages)?
			dynamicPackages :
			[dynamicPackages];
		const packagesToLoad = this.packages.concat(dynamicPackages);
		const loading = packagesToLoad.map(pkg=>this._loadPackage(pkg))
		const loaded = await Promise.all(loading);
		this.reset();
		try{
			loaded.forEach(pkg=>{
				this._processPackage(pkg);
			});
		}catch(e){
			this.error('Exception',e);
		}
		this.parser.endTypes();
		this.resetVersion();
	}

	parse(text, target, verbosity){
		return this.parser.parse(text, target, new Logger(this.logger, verbosity));
	}

	parseWants(text, target){
		return this.parser.parseWants(text, target);
	}

	getGrammer(){
		return this.parser.getGrammer();
	}
	suggestCompletion(text, target, verbosity){
		return suggestCompletion(
			this, 
			text, 
			target, 
			new Logger(this.logger || console, verbosity)
			);
	}
	suggestTokens(text, target, options, verbosity){
		return suggestTokens(this, text, target, options, new Logger(this.logger, verbosity));
	}

	_dumpParseRules(target){
		this.parser._dumpParseRules(target);
	}
	_dumpUsedBy(target){
		this.parser._dumpUsedBy(target);
	}

	setPackages(packages=[base]){
		this.packages = packages;
	}
	async getSpec(entity){
		const type = entity.$type;
		//assuming the package is loaded and no need to resolve type
		return this.getTypeSpec(type);
	}
	
	getTypeSpec(type){
		if(!type){
			return {};
		}
		this._ensureSpecializedIsRegistered(type);
		return this.repo[searchString(type)] || {};
	}
	/**
	 * returns the singular form of a plural type. E.g. getSingular('element*') should return 'element'
	 * @param {String} type the plural type name
	 */
	getSingular(type){
		//currently assuming all collections are notes with ending `*`
		assume(typeof type === 'string',ParamValue,'getSingular takes a string parameter');
		if(type.endsWith('*')){
			return type.substr(0,type.length-1);
		}else{
			return type;
		}
	}

	typeHasSpec(type){
		this._ensureSpecializedIsRegistered(type);
		return this.repo[type] !== undefined;
	}

	/**
	 * Returns all specs that their `isa` property includes `type`
	 * @param {String} type the class type
	 */
	getClassMembers(type){
		if(type.getClassMembers){
			return type.getClassMembers(this);
		}
		const isaList = this.isaRepo[type.toString()]||[];
		const {generic,specialized} = getSpecializedType(type);
		if(!generic){
			return isaList;
		}
		//this is a generic type - generate isa based on specialized type
		const specializedSpec = this.getTypeSpec(specialized);
		const members = Array.from(specializedSpec.isa||[])
			.map(t=>{
				return this.isaRepo[`${generic}<${t}>`];
			});
		members.push(this.isaRepo[`${generic}<any>`])
		members.push(isaList);
		return unique(members.flat())
			.map(type=>{
				if(this.isTypeGeneric(type)){
					//this is a generic - specialized using the specialied value
					return `${type.toString()}<${specialized}>`
				}else{
					return type;
				}
			})
			.filter(type=>!this.isSet(type));
	}

	getExpressionsByValueType(type,allowCalc=true,expectedRole){
		if(type.getExpressionsByValueType){
			type.getExpressionsByValueType(this,allowCalc,expectedRole);
		}
		//get all valueTypes
		let current = Object.keys(this.valueTypeRepo);
		//TODO this next line doesn't make sense but it works. We need to work out the isa relationship with valueTypes
		current = current.filter(key=>this.isa(type,key)||this.isa(key,type));
		//get list of all entities that their valueType is in current
		current = current.map(key=>this.valueTypeRepo[key])
		//flatten the list
		current = current.flat();
		//if allowCalc is false then only allow if role is not calc
		current = current.filter(({role})=>{
			role  = role || Role.calc;//defalt role is calc
			if(expectedRole){
				//if expectedRole is specified then ignore allowCalc
				return matchRole(role, expectedRole);
			}
			return allowCalc? true : (role !== Role.calc);
		});
		current = current.map((entry)=>{
			const entryType = entry.type;
			if(this.isTypeGeneric(entryType)){
				//if the retreived type is generic then assume the instantiation of the type takes the searched for valueType as first template argument
				return `${entryType}<${type}>`
			}else{
				return entryType;
			}
		});
		return unique(current);
	}

	getTypes(){
		if(this.repo){
			return Object.keys(this.repo);
		}else{
			return [];
		}
	}

	/**
	 * Add a package to the dictionary. the package can either be a string identifying the package or the package object itself
	 * @param {Object|String} pckg the package to add
	 */
	async addPackage(pckg){
		this.packages.push(pckg);
		await this.reload();
	}

	_isDefinitionGroup(entity){
		if(typeof entity !== 'object' || entity === null){
			return false;
		}
		return this.isa(entity.$type,'definition group');
	}
		/**
	 * Register an instance in the dictionary for later retrieval
	 * @param {String} id identification of instance
	 * @param {String} type type to register
	 * @param {*} value value of instance
	 * @param {String} label the name used to display the instance
	 * @param {String} description description of the instance. This can be used in suggestions for additional info
	 * @param {"artifact"|"value"} role the role of the instance
	 * @returns {Reference} a reference to the instance
	 */
	_registerInstance(entry){
		const {valueType,name,value,label,description} = entry;
		if(valueType){
			this._ensureSpecializedIsRegistered(valueType);
			if(!this.instancesByType[valueType]){
				this.instancesByType[valueType] = [];
			}
			this.instancesByType[valueType].push(entry);
			this.parser.addInstance(entry);
			this.instances[name] = value;
			return reference(
				label||name,
				valueType,
				'dictionary:'+ name,
				description,
				value
			)
		}
	}

	/**
	 * @typedef FunctionEntry Define how an action or expression type uses a function. It can specify a function from an imported library, a class function or a predefined function within calling context. For traits, the subject is passed as the `this` object.
	 * @property {String} library - export library for this function
	 * @property {String} object used for object functions to determine which spec property is associated with the function object
	 * @property {String} name - name of the function to call
	 * @property {String[]} args an array of spec properties to be called as arguments.
	 */
	/**
	 * Associate a function with a type name. This is used to define functions used to calculate expressions and execute actions.
	 * @param {String} name type name
	 * @param {FunctionEntry} functionEntry
	 * @param {NaturaPackage} pkg
	 */
	_registerFunction(name,functionEntry,pkg){
		if(!functionEntry){
			return;
		}
		if(typeof functionEntry === 'string'){
			const parsed = functionEntry.match(/^([^@]+)@([^\(]+)(?:\(([^^\)]*)\))?$/);
			assume(parsed,'function reference failed to parse',functionEntry);
			this.functions[name] = {
				library:parsed[2],
				name:parsed[1],
				args:parsed[3]? parsed[3].split(',').map(item=>item.trim()) : [],
				pkg
			}
		}else{
			functionEntry.pkg = pkg;
			this.functions[name] = functionEntry;
		}
	}

	getFunctionEntry(name){
		return this.functions[name] || {};
	}

	/**
	 * Get a list of references to instances stored in the dictionary.
	 * @param {Type} type type of instances to search for
	 * @param {"artifact"|"value"} role
	 * @returns Reference[]
	 */
	getInstancesByType(type,role){
		//TODO there is a potential bug because we do not check for uniqueness (like in valueTypeRepo)
		let current = Object.keys(this.instancesByType);
		current = current.filter(key=>this.isa(key,type));
		current = current.map(key=>this.instancesByType[key]);
		current = current.flat();
		if(role){
			current = current.filter(entry=>entry.role===role);
		}
		current = current.map(entry=>
			Object.assign({},entry,{$type:'reference'})
		);
		return current;
	}

	getInstanceByID(ID){
		return this.instances[ID];
	}

	_processDefinition(entity,model={},pkg){
		if(typeof entity !== 'object' || entity === null){
			//nothing to process
			return;
		}

		//ensure model isa is not empty
		model.isa = model.isa || [];
		let memberModel = model;
		if(this._isDefinitionGroup(entity)){
			entity.members = entity.members || [];
			if(entity.model && typeof entity.model === 'object'){
				entity.model.isa = entity.model.isa || [];
				memberModel = deepmerge(model,entity.model);
				//add group isa as a separate subtype of model isa
				entity.model.isa.forEach(type=>{
					this._processDefinition({type:type},memberModel,pkg)
				});
			}
			for(let i=0;i<entity.members.length;++i){
				this._processDefinition(entity.members[i],memberModel,pkg);
			}
		}else{
			entity.isa = entity.isa || [];
			this._registerType(
				specType(entity),
				deepmerge(model,entity),
				pkg
			);
		}
	}

	_processPackage(pkg){
		registerPackage(this, pkg)
	}

	/**
	 * Register a type in the dictionary
	 * @param {String} type the type to register. This will be used to retreive the type
	 * @param {Object} spec the spec body
	 */
	_registerType(type,spec,pkg){
		const specType = spec.$type;
		const specTypeSpec = this.getTypeSpec(specType);
		if(typeof specTypeSpec.register === 'function'){
			//the spec defines its own register function - use it
			return specTypeSpec.register(this,type,spec,pkg);
		}
		if(pkg){
			//connect the spec to the package
			spec.$package = pkg;
		}
		//normalize structure of type spec
		//isa
		spec.isa = spec.isa || [];
		if(!entityIsArray(spec.isa)){
			spec.isa = [spec.isa];
		}

		//properties
		spec.properties = spec.properties || {};

		//pattern
		if(spec.pattern){
			parsePattern(spec.pattern).fields.forEach(field=>{
				if(spec.properties[field.name] === undefined && !field.name.includes('|')){
					spec.properties[field.name] = {type:field.type};
				}
			});
		}

		//convert properties that are defined as string to object type
		Object.keys(spec.properties).forEach(key=>{
			if(entityType(spec.properties[key]) === 'string'){
				spec.properties[key] = {type:spec.properties[key]};
			}
		});
		Object.values(spec.properties).forEach(prop=>assume(entityType(prop) === 'object','prop should be an object. it is '+JSON.stringify(prop)));

		//add the type to the repos
		unique(spec.isa).forEach(parent=>{
			this._registerIsa(type,parent);
		});
		if(this.repo[type]){
			//an entity with this type already exists - warn
			this.logger.warn('[dictionary] Adding an entity to the dictionary with a name that already exists',JSON.stringify(type))
		}
		this.repo[type]=spec;
		this.parser.addType(spec, pkg);
		this._registerValueType(spec.valueType,type,spec.role);
		this._registerFunction(type,spec.fn,pkg);
	}
/**
 * A specialized type is a type that is derived from a generic type and its insance value is initialized with specific properties. It is a similar concept to genrics in typescript however, the specialized values are part of the instance object. The reason for that is that we need the specialized values in the instance so we can use them in the application. 
 * The properties title, description and pattern in the generic type are treated as handlebars templates where the data is the specialized value object
 * @param {String} type the type name of the specialized type
 * @param {String} generic type name of the generic type
 * @param {Object} specializedValue an object to use as the specialized value of the instance
 * @param {Object} override optional object to override the generic spec properties
 */
	_registerSpecializedType(specialized,generic,specializedValue,override){
		const type = `${generic}<${specialized}>`
		const specializedSpec = this.getTypeSpec(specialized);
		const spec = this.getTypeSpec(generic);
		assume(spec,`Specialized type '${type}' does not have a generic defined`);
		const sSpec = Object.create(spec);
		sSpec.$specialized = specializedValue;
		sSpec.$generic = generic;
		
		//calculate title, pattern and description values
		sSpec.title = calcTemplate(spec.title,specializedValue);
		sSpec.description = calcTemplate(spec.description,specializedValue);
		sSpec.pattern = calcTemplate(spec.pattern,specializedValue);
	
		//assign the override properties to this spec
		Object.assign(sSpec,override);
		
		//register the type
		this._registerType(type,sSpec,spec.$package);
		
		return sSpec;
	}

	_registerValueType(valueType,type,role){
		if(!valueType){
			return;
		}
		valueType = Type(valueType,null,this).toString();//turn type objects into strings
		this._ensureSpecializedIsRegistered(valueType);
		if(this.valueTypeRepo[valueType] === undefined){
			this.valueTypeRepo[valueType] = []
		}
		this.valueTypeRepo[valueType].push({type,role});
}

	/**
	 * Register an isa relationship
	 * @param {String} type
	 * @param {String} parent type of the parent
	 * @param {Booldan} notInType true if this isa relationship was defined separately and not derived from isa field. If true then need to register separaetly in grammer
	 */
	_registerIsa(type,parent, notInType){
		if(!Array.isArray(this.isaRepo[parent])){
			this.isaRepo[parent] = [];
		}
		this.isaRepo[parent].push(type);
		if(notInType){
			this.parser.addIsa(type, parent);
		}
	}
	async _loadPackage(pckg){
		if(typeof pckg === 'string'){
			//need to load it
			const ret = await loadPackage(pckg, this.logger);
			return ret;
		}
		assume(entityType(pckg) === 'object',LoadError,"The '"+ pckg +"' package cannot be loaded");

		//convert the raw package object to entity so we can use value functions defined in the specs
		return deepCopy(pckg);
	}
	/**
	 * Check if `type` is a specialized type like `todo item.<collection>`. If it is a specialized type that is not registered then register it. Currently only single generic property is supported
	 * @param {Type} type type to test
	 */
	_ensureSpecializedIsRegistered(type){
		const {generic,specialized} = getSpecializedType(type)
		if(!generic){
			//this is not a specialized generic
			return;
		}
		if(this.isSet(specialized) || !this.repo[generic]){
			//specialized value is a set hense the specialized instance is a set
			return;
		}

		const current = this.repo[searchString(type)];
		if(current){
			//this is already registered
			return;
		}
		const genericSpec = this.getTypeSpec(generic);
		if(!genericSpec){
			throw new Error('Trying to use a generic that is not defined: '+searchString(type));
		}
		if(
			!Array.isArray(genericSpec.genericProperties)|| 
			genericSpec.genericProperties.length < 1){
				//set default generic property to type
				genericSpec.genericProperties = ['type'];
		}
		return this._registerSpecializedType(
			specialized,
			generic,
			{
				//assuming this is a type
				[genericSpec.genericProperties[0]]:Type(specialized,null,this)
			}
		)
	}

	/** a set is a definition of collection of types. It can be a category that does not have a spec or a generic
	 */
	isSet(type){
		const spec = this.getTypeSpec(type);
		if(!spec.name){
			return true;
		}
		if(isSpecGeneric(spec)){
			return true;
		}
	}
}

function deepCopy(source){
	return deepmerge({},source);
}

function unique(arr){
	return arr.filter(function(value, index, self) {
		return self.indexOf(value) === index;
	})
}

function searchString(str){
	return str? (str.searchString || str.toString()) : 'any';
}

function getSpecializedType(type){
	const matched = (searchString(type)).match(/^([^\.\<\>]+)\.?\<(.+)\>$/);
	return matched? {generic:matched[1],specialized:matched[2]} : {};
}

const dictionaries = {}
/**
 * get a dictionary from list of packages. If a dictionary with these packags already exists then return it
 */
export async function getDictionary(packages, logger){
	const id = packages.join(',');
	if(dictionaries[id]){
		return dictionaries[id];
	}
	const dictionary = new Dictionary(packages, logger);
	await dictionary.reload();
	dictionaries[id] = dictionary;
	return dictionary;
}


/**
 * A function that can be used to invalidate a package based on its id
 * @param {*} id package id
 */
export function changeListener(id){
	//invalidate all dictionaries that include the package id
	if(id.startsWith('public:')){
		id = id.substr('public:'.length);
	}
	Object.keys(dictionaries).forEach(key=>{
		if(key.split(',').includes(id)){
			delete dictionaries[key];
		}
	})
}
