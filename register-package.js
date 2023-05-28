/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {noCase}  from "no-case";
import Type from './type.js'

export default function registerPackage(dictionary,pkg){
	(pkg.components||[]).forEach(component=>registerComponent(component,dictionary,pkg));
	registerValues(dictionary,pkg);
	registerTypes(dictionary,pkg);
	registerExpressions(dictionary,pkg);
	registerActions(dictionary,pkg);
	registerCategories(dictionary,pkg.categories||{});
}

function registerComponent(component,dictionary,pkg){
	try{
		const props = generateProps(component,component.props||[],component.slots||[]);
		const display = generateComponentDisplay(component);
		const pattern = component.pattern || `${component.title||component.name} named <<ref>>`;
		const childrenProperty = generateChildrenProperty(component);
		const name = component.name;
		const ret = {
			name,
			title:component.title,
			description:component.description,
			init: component.init,
			properties:{
				props:{
					type:props.name,
					title:'properties',
					description:'Specify the properties of the component',
					initType:props.name,
					expanded:true,
					displayInline:false,
					context:[{$type:'use context',path:'..'}]
				},
				display:{
					type:display.name,
					description:'Set data to display in component, when to display it and how to reference it',
					context:[{$type:'use context',path:'..'}]
				},
				ref:{
					title:'reference',
					type:'string',
					noSuggestions:true,
					description:'reference name used to reference and identify this component. The reference is used to identify the component so it should be descriptive. It may contain spaces.',
					placeholder:'reference name',
					unique:{
						query:'/**/?isa component/ref',
						base: component.title||component.name
					}
				},
			},
			context: [
				{$type:'use context',path:'display'},
				{$type:'use context',path:'props'},
				{$type:'use context',path:'slots/*/*'},
				{$type:'use scope',path:'',key:'expose',access:'$root.$refs.{{ref}}'},
				{$type:'use context',path:'..'},
				{
					$type: 'basic emit',
					name:'{{ref}}',
					access:'$root.$refs.{{ref}}',
					type:component.name,
					useScope:true
				}
			],
			scope:{
				expose:[
					{
						$type:'scope mixin',
						path:'display',
						key:'expose'
					},
					{
						$type:'scope mixin',
						path:'props',
						key:'expose'
					}
				]
			},
			pattern,
			description:component.description,
			suggest:{
				screenshot:component.screenshot
			}
		}
		//copy context and scope from component
		ret.context.push(...(component.context||[]));
		Object.assign(ret.scope,component.scope);

		const events  = generateEvents(dictionary,component,pkg);
		if(childrenProperty){
			ret.properties.children = childrenProperty;
		}
		ret.show = generateShow(component,ret,props);
		
		ret.isa = component.isa||[];
		ret.isa.forEach(supertype=>{
			dictionary._registerIsa(name,supertype)
		});


		//config property
		ret.properties.config = {
			type:{
				$type: 'role type',
				role: 'type',
				type:{
					$type:'one of',
					collection:true,
					types:[...events,'style config','css class'],
				}
			},
			description:'component configuration including style, classes, properties and events',
			expanded:true,
			hideName:true,
			title:'component configuration'
		}
		ret.additional = ['config'];


		//registrations
		dictionary._registerType(props.name,props,pkg);
		dictionary._registerType(display.name,display,pkg);
		dictionary._registerType(ret.name,ret,pkg);
		dictionary._registerIsa(component.name,'component');
		dictionary._registerFunction(component.name,generateComponentFn(component),pkg);
	}catch(e){
		console.error('Failed to process component',component.name,component,'\n',e)
	}
}

function generateProps(component,props,slots){
	return {
		name: 'props.' + component.name,
		properties:generatePropsProperties(props,slots)
	}
}

function registerCategories(dictionary,categories){
	Object.entries(categories).forEach(([category,members])=>{
		(members||[]).forEach(member=>{
			dictionary._registerIsa(member, category, true);
		});
	})
}

function generatePropsProperties(props=[],slots=[]){
	const ret = {};
	//add plain properties
	for(let i=0;i<props.length;++i){
		ret[props[i].name] = generatePropertyEntry(props[i],{});
	}

	//add slots that are not default
	for(let j=0;j<slots.length;++j){
		if(slots[j].name === 'default' || !slots[j].name){
			//this slot will be displayed as content elements
			continue;
		}
		const entry = generatePropertyEntry(slots[j],{role:'type'});
		ret[slots[j].name] = entry;
	};
	return ret;
}

function generatePropertyEntry(prop,{role}){
	const ret = {
		type: getType(prop.type,role),
		title: prop.title || noCase(prop.name),
		description:prop.description
	}
	if(prop.expanded){
		ret.expanded = prop.expanded;
	}

	if(prop.initType){
		ret.init = {
			$type: prop.initType
		}
	}

	return ret;
}

function generateComponentDisplay(component){
	return {
		name:'display.' + component.name,
		show:['displayCondition'],
		displayCondition:{
			type:'condition',
			placeholder:'display condition',
			title:'display condition',
			description:'A condition determining if the component should be displayed. The component will only be displayed if the condition is true'
		},
		context:[]
	}
}


function generateChildrenProperty(component){
	if(!Array.isArray(component.slots)){
		return undefined;
	}
	const defaultSlot = component.slots.find(s=>(s.name==='default' || s.name === undefined));
	if(!defaultSlot){
		return undefined;
	}
	return {
		type:{
			$type:'role type',
			role: 'type',
			type: getType(defaultSlot.type||'component',null,true)
		},
		expanded:true,
		title: (defaultSlot.title && defaultSlot.title !=='default')? 
			defaultSlot.title : (defaultSlot.type || 'content elements'),
		description:defaultSlot.description,
		childSpec: {
			context: [{
				$type: "use context",
				path: "../.."
			}]
		}
	}
}

function generateShow(input,component,props){
	const ret = [];
	if(input.show){
		ret.push(...input.show);
	}else{
		const propList = Object.keys(props.properties).map(key=>`props/${key}`);
		ret.push(...propList);
	}
	if(component.properties.children){
		ret.push('children');
	}
	return ret;
}

function generateComponentFn(component){
	const entry = {
		component:true,
		type:'constant',
		importLibrary:component.importLibrary,
		name: component.importIdentifier || component.name
	}
	if(Array.isArray(component.slots)){
		//generate slots
		if(!entry.options){
			entry.options = {};
		}
		if(!entry.options.slots){
			entry.options.slots = {};
		}
		component.slots.forEach(slot=>{
			if(slot.name && slot.name !== 'default'){
				entry.options.slots[slot.name] = {
					name: slot.name,
					slotName: slot.slotName || slot.name
				}
			}
		})
	}

	if(component.placeholders){
		if(!Array.isArray(component.placeholders)){
			console.error('component placeholders must be an array. Got',component.placeholders);
		}else{
			//generate placeholders
			if(!entry.options){
				entry.options = {};
			}
			entry.options.placeholders = component.placeholders;
		}
	}

	if(component.editModeStyle){
		//generate edit mode style
		entry.options.devStyle = component.editModeStyle;
	}
	return entry;
}

function registerValues(dictionary,pkg){
	const values = Array.isArray(pkg.values)? pkg.values : [];
	values.forEach(value=>{
		if(!value.call){
			value.value = value.value !== undefined? value.value : (value.label || value.title || value.name);
			value.label = value.label || value.title || value.name;
			value.valueType = value.valueType || value.type;
			dictionary._registerInstance(value);
		}else if(value.call){
			dictionary._registerType(value.name,{
				name:value.name,
				title: value.title || value.name,
				valueType:value.type,
				description: value.description,
				fn:	{
					library: pkg.name,
					name: value.name,
					args:value.args || []
				},
				role:'value'
			})
			dictionary._registerFunction(
				value.name,
				{
					library:pkg.name,
					name: value.name,
					args:value.args || []
				}
			,
				pkg);

		}else{
			console.error('Value entry must have either `value` or `call` properties',value);
		}
	})
}

function getType(base,role,collection){
	if(typeof base !== 'string'){
		//we can only process string type - assuming this is an object type
		return base;
	}
	const parsed = base.match(/^(.*?)(\[\]|\*)?$/)
	if(parsed[2] || collection){
		base = parsed[1] + '*';//array
	}
	return {
		$type: role? 'role type' : 'base type',
		type: base,
		role: role
	}
}

function registerTypes(dictionary,pkg){
	(pkg.types||[]).forEach(t=>{
		dictionary._registerType(t.name,t,pkg);
		//register getters if required
		if(t.generateGetters){
			Object.entries(t.properties||[]).forEach(([key,value])=>{
				registerProperty(t.name, key, value, dictionary)
			}
			)
		}
	})
}

function registerExpressions(dictionary,pkg){
	if(pkg.expressions && !Array.isArray(pkg.expressions)){
		throw new Error("pkg expressions is not an array - " + JSON.stringify(pkg.expressions));
	}
	(pkg.expressions||[]).forEach(t=>{
		dictionary._registerType(t.name,t,pkg);
		dictionary._registerFunction(t.name,{
			library:pkg.name,
			name: t.importIdentifier,
			args: (t.args||[]),
			isFactory:t.isFactory || false
		},
		pkg)
	})
}

function registerActions(dictionary,pkg){
	(pkg.actions||[]).forEach(t=>{
		dictionary._registerType(t.name,t,pkg);
		dictionary._registerFunction(t.name,{
			library:pkg.name,
			name: t.importIdentifier,
			args: (t.args||[]),
			isFactory:t.isFactory || false
		},
		pkg)
	})
}

function registerProperty(objectType, access, def, dictionary){
	const propertyName = (def.title || def.name || key);
	const name = 'get ' + objectType.toString() + '.' + propertyName;
	const description = def.description || `${propertyName} property of ${objectType.toString()}`
	const basicValueType = Type(getType(def.type));
	if(basicValueType.isCollection){
		dictionary._registerType(name,{
			name,
			$generic: 'xget',
			title:propertyName + ' of a ' + objectType.toString(),
			description,
			inlineDetails:'collapsed',
			pattern: propertyName + ' of <<object>>',
			properties:{
				object:{type:objectType},
				access:{init:access},
				itemCount: {
					type:'number',
					title: 'number of items',
					placeholder:'number of items',
					description: 'specify number of items to retreive. This cancels any paging capabilities of the property. i.e. the property value will be an array with max. number of items as the specified number.'
				}
			},
			show:['itemCount'],
			valueType: Type(`dataset<${basicValueType.singular.toString()}>`),
			isa:['data property']
		})
	}else{
		//property is not a collection
		dictionary._registerType(name,{
			name,
			title:propertyName + ' of a ' + objectType.toString(),
			description,
			pattern: propertyName + ' of <<object>>',
			properties:{
				object:{type:objectType},
				access:{init:access}
			},
			valueType: basicValueType,
			isa:['data property']
		})
	}
}

function generateEvents(dictionary,component,pkg){
	return (component.events||[]).map(evt=>{
		const entity = {
			name: `${evt.name}.${component.name}`,
			title: evt.title + ' (event)',
			description:evt.description,
			pattern:'on ' + evt.title + ': <<value>>',
			$generic:'component config',
			$specialized:{
				key:evt.name,
				type:'event'
			},
			properties:{
				value:{
					type: {
						$type: 'role type',
						type:'action',
						role: 'type'
					},
					placeholder:'event handler',
					description: evt.description,
					viewerOptions:{
						initialCode:'function(evt){\n  //your event handler code here\n}',
						title:`Event handler for ${evt.title} event`
					}
				}
			}
		}
		dictionary._registerType(entity.name,entity,pkg);
		return entity.name;
	})
}