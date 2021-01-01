import { LoadError, assume, ParamValue } from "./error";
import { loadPackage } from "./data";
import { specType } from "./spec";
import { parsePattern } from "./pattern";
import {entity,entityType,entityIsArray} from './entity'
import deepmerge from "deepmerge";

export default class Dictionary{
	constructor(packages=['base']){
		assume(entityIsArray(packages),'packages should be an array. It is '+JSON.stringify(packages));
		this.packages = packages;
		this.reset();
		this.resetVersion();
	}

	reset(){
		this.initiated = true;
		this.repo = {};
		this.isaRepo = {};
		this.valueTypeRepo = {};
		this.collectionRepo = [];
		this.instances = {};
		this.instancesByType = {};
		this._registerType('entity definition group',{isa:['definition group']});
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
		const spec = this.getTypeSpec(type);
		const ret = spec !== undefined &&
			spec.isa !== undefined &&
			spec.isa.includes(className);
		return ret;
	}
	resetVersion(){
		this.version = ''+(Number(new Date()) - new Date('2020-01-01')+Math.random()).toString(36).replace('.','');
	}

	/**
	 * Initial load of packages to the dictionary. This must be called before the dictionary is used
	 */
	async load(dynamicPackages){
		return this.reload(dynamicPackages);
	}

	/**
	 * Reload the packages. This should be called when the packages are changed and need to be reprocessed. All packages are reloaded. In addition, dynamicPackages are also loaded
	 */
	async reload(dynamicPackages=[]){
		dynamicPackages =	entityIsArray(dynamicPackages)?
			dynamicPackages :
			[dynamicPackages];
		const packagesToLoad = this.packages.concat(dynamicPackages)
		const loaded = await Promise.all(
			packagesToLoad.map(pkg=>this._loadPackage(pkg))
		);
		this.reset();
		loaded.forEach(pkg=>{
			const packageCopy = deepCopy(pkg);
			this._processPackage(packageCopy);
		});
		this.resetVersion();
	}

	setPackages(packages=['base']){
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
		if(type === 'any'){
			return union(Object.values(this.valueTypeRepo));
		}
		if(this.valueTypeRepo[type]){
			return this.valueTypeRepo[type];
		}else{
			return [];
		}
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
	 * @param {String} name name of instance
	 * @param {String} type type of instance
	 * @param {String} id id of instance
	 * @param {*} value value of instance if exists
	 */
	_registerInstance(name, type, id, value){
		if(!this.instancesByType[type]){
			this.instancesByType[type] = [];
		}
		this.instancesByType[type].push({
			name,
			type,
			path:'dictionary://'+id,
			value
		});
		this.instances[id] = value;
	}

	getInstancesByType(type,scope='*'){
		return (this.instancesByType[type]||[])
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
			let addShow = false;
			parsePattern(spec.pattern).fields.forEach(field=>{
				if(spec.properties[field.name] === undefined){
					spec.properties[field.name] = {type:field.type};
					if(addShow){
						spec.show.push(field.name);
					}
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

		//if show property does not exist, then create it
		if(!spec.show){
			spec.show = [];
			Object.keys(spec.properties).forEach(prop=>spec.show.push(prop));
		}

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
			this._registerIsa(spec.instanceType,'property type');
		}
	}
	_registerIsa(type,parent){
		if(!Array.isArray(this.isaRepo[parent])){
			this.isaRepo[parent] = [];
		}
		this.isaRepo[parent].push(type);
	}
	async _loadPackage(pckg){
		const pkgObject = entityType(pckg) === 'string'?await loadPackage(pckg) : pckg;
		assume(entityType(pkgObject) === 'object',LoadError,"The '"+ pckg +"' package cannot be loaded");

		//convert the raw package object to entity so we can use value functions defined in the specs
		return entity(pkgObject,this);
	}
}

function deepCopy(source){
	return source.$raw || source;
}

function union(arrays){
	const all = {};
	arrays.forEach(arr=>arr.forEach(item=>all[item]=true));
	return Object.keys(all);
}

function unique(arr){
	return arr.filter(function(value, index, self) {
		return self.indexOf(value) === index;
	})
}
