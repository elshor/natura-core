/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { LoadError, assume, ParamValue } from "./error.js";
import { specType } from "./spec.js";
import { parsePattern } from "./pattern.js";
import {entityType,entityIsArray} from './entity.js'
import deepmerge from "deepmerge";
import base from './packages/base.js'
import {createLocation} from './location.js'

export default class Dictionary{
	constructor(packages=[base]){
		assume(entityIsArray(packages),'packages should be an array. It is '+JSON.stringify(packages));
		this.packages = packages;
		this.reset();
		this.resetVersion();
	}

	reset(){
		//clear old data
		this.initiated = true;
		this.repo = {};
		this.instanceTypes = {};
		this.isaRepo = {};
		this.valueTypeRepo = {};
		this.collectionRepo = [];
		this.instances = {};
		this.instancesByType = {};
		this.functions = {};

		//initialization registerations
		this._registerType('entity definition group',{isa:['definition group']});
		this._registerIsa('definition group','entity definition group')
		this._registerIsa('definition group','property definition group')
		this._registerIsa('definition group','event definition group')
		this._registerIsa('definition group','expression definition group')
		this._registerIsa('definition group','action definition group')
		this._registerInstanceType('any instance','any');
		this._registerInstanceType('application instance','application type');
	}

	isInitiated(){
		return this.initiated === true;
	}

	isa(type,className){
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
		if(this.isaRepo[className]){
			return this.isaRepo[className].includes(type)
		}
		if(this.isInstance(type) && this.isInstance(className)){
			const instanceOf = this.typeOfInstance(type);
			const classType = this.typeOfInstance(className);
			return this.isa(instanceOf,classType);
		}

		return false;
	}
	isInstance(type){
		if(typeof type !== 'string'){
			return false;
		}
		if(this.instanceTypes[type]){
			return true;
		};
		if(type.match(/^(a|an)\s/)){
			//guessing this is an instance
			return true;
		}
		return false;
	}

	resetVersion(){
		this.version = ''+(Number(new Date()) - new Date('2020-01-01')+Math.random()).toString(36).replace('.','');
	}

	/**
	 * Initial load of packages to the dictionary. This must be called before the dictionary is used
	 */
	load(dynamicPackages){
		return this.reload(dynamicPackages);
	}

	/**
	 * Reload the packages. This should be called when the packages are changed and need to be reprocessed. All packages are reloaded. In addition, dynamicPackages are also loaded
	 */
	reload(dynamicPackages=[]){
		dynamicPackages =	entityIsArray(dynamicPackages)?
			dynamicPackages :
			[dynamicPackages];
		const packagesToLoad = this.packages.concat(dynamicPackages)
		const loaded = packagesToLoad.map(pkg=>this._loadPackage(pkg))
		this.reset();
		loaded.forEach(pkg=>{
			const packageCopy = deepCopy(pkg);
			this._processPackage(packageCopy);
		});
		this.resetVersion();
	}

	setPackages(packages=[base]){
		this.packages = packages;
	}

	getTypeSpec(type){
		if(!type){
			return {};
		}
		return this.repo[type.toString()] || {};
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
		return this.repo[type] !== undefined;
	}

	/**
	 * Returns all specs that their `isa` property includes `type`
	 * @param {String} type the class type
	 */
	getClassMembers(type){
		return this.isaRepo[type]||[];
	}

	getExpressionsByValueType(type){
		return unique(
			Object.keys(this.valueTypeRepo)
			.filter(key=>this.isa(key,type))
			.map(key=>this.valueTypeRepo[key])
			.flat()
		);
	}

	isClass(type){
		return this.isaRepo[type] !== undefined;
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
	addPackage(pckg){
		this.packages.push(pckg);
		this.reload();
	}

	_isDefinitionGroup(entity){
		if(typeof entity !== 'object' || entity === null){
			return false;
		}
		return this.isa(entity.$type,'definition group');
	}
		/**
	 * Register an instance in the dictionary for later retrieval
	 * @param {String} name identification of instance
	 * @param {String} type type to register
	 * @param {*} value value of instance
	 */
	_registerInstance(name, type, value){
		if(type){
			if(!this.instancesByType[type]){
				this.instancesByType[type] = [];
			}
			this.instancesByType[type].push({name,type,value});
		}
		this.instances[name] = value;
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
	 */
	_registerFunction(name,functionEntry){
		if(typeof functionEntry === 'string'){
			const parsed = functionEntry.match(/^([^@]+)@([^\(]+)\(([^^\)]*)\)$/);
			assume(parsed,'function reference failed to parse',functionEntry);
			this.functions[name] = {
				library:parsed[2],
				name:parsed[1],
				args:parsed[3].split(',').map(item=>item.trim())
			}
		}else{
			this.functions[name] = functionEntry;
		}
	}

	getFunctionEntry(name){
		return this.functions[name] || {};
	}

	getInstancesByType(type){
		return Object.keys(this.instancesByType)
			.filter(key=>this.isa(key,type))
			.map(key=>this.instancesByType[key])
			.flat()
			.map(entry=>entry.value);
	}

	/**
	 * Given a type, find its instance type. E.g. for type 'string' the return value will be 'a string'
	 * @param {Type} type
	 * @returns {String} the instance type
	 */
	instanceType(type){
		const spec = this.getTypeSpec(type);
		if(!spec){
			return 'any instance';
		}
		return spec.instanceType || 'any instance';
	}

	typeOfInstance(instanceType){
		if(this.instanceTypes[instanceType]){
			return this.instanceTypes[instanceType];
		};
		const parsed = instanceType.match(/^[a|an]\s(.+)$/);
		if(parsed){
			return parsed[1];
		}else{
			return null;
		}
	}

	getInstanceType(type){
		//TODO handle an
		return this.getTypeSpec(type).instanceType || 'a '+type;
	}

	getInstanceByID(ID){
		return this.instances[ID];
	}

	_processDefinition(entity,model={}){
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
					this._processDefinition({type:type},memberModel)
				});
			}
			for(let i=0;i<entity.members.length;++i){
				this._processDefinition(entity.members[i],memberModel);
			}
		}else{
			entity.isa = entity.isa || [];
			this._registerType(
				specType(entity),
				deepmerge(model,entity)
			);
		}
	}

	_processPackage(pkg){
		const pkgSpec = this.getTypeSpec(pkg.$type);
		if(typeof pkgSpec.register === 'function'){
			//register function defined for the package - process it
			pkgSpec.register(this,pkg.$type,pkg);
		}
		for(let p in pkg){
			if(this._isDefinitionGroup(pkg[p])){
				this._processDefinition(pkg[p]);
			}
		}
	}

	/**
	 * Register a type in the dictionary
	 * @param {String} type the type to register. This will be used to retreive the type
	 * @param {Object} spec the spec body
	 */
	_registerType(type,spec){
		const specType = spec.$type;
		const specTypeSpec = this.getTypeSpec(specType);
		if(typeof specTypeSpec.register === 'function'){
			//the spec defines its own register function - use it
			return specTypeSpec.register(this,type,spec);
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
				if(spec.properties[field.name] === undefined){
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
		this.repo[type]=spec;

		//register valueType
		if(entityType(spec.valueType) === 'string'){
			if(this.valueTypeRepo[spec.valueType] === undefined){
				this.valueTypeRepo[spec.valueType] = []
			}
			this.valueTypeRepo[spec.valueType].push(type);
		}
		//register instanceType
		if(spec.instanceType){
			this._registerInstanceType(spec.instanceType,type);
		}

		//register fn
		if(spec.fn){
			this._registerFunction(type,spec.fn);
		}
	}
	_registerIsa(type,parent){
		if(!Array.isArray(this.isaRepo[parent])){
			this.isaRepo[parent] = [];
		}
		this.isaRepo[parent].push(type);
	}
	_registerInstanceType(instanceType,type){
		this.instanceTypes[instanceType] = type;
	}
	_loadPackage(pckg){
		assume(entityType(pckg) === 'object',LoadError,"The '"+ pckg +"' package cannot be loaded");

		//convert the raw package object to entity so we can use value functions defined in the specs
		return createLocation(pckg,this).entity;
	}
}

function deepCopy(source){
	return source.$raw || source;
}

function unique(arr){
	return arr.filter(function(value, index, self) {
		return self.indexOf(value) === index;
	})
}
