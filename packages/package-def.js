/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
export default [
	{
		name:'package definition',
		show:['name','description','components','types'],
		properties:{
			name:{type:'string',placeholder:'name of component',noSuggestions:true},
			description:{type:'richtext'},
			components:{type:'component definition*',expanded:true},
			types:{type:'type definition',expanded:true}
		},
		register(dictionary,_,spec,pkg){
			registerPackage(dictionary,spec,spec);
		}
	},
	{
		name:'component definition',
		show:['title','description','props'],
		additional:['importLibrary','importIdentifier'],
		pattern:"<<name>>",
		key:'name',
		properties:{
			name:{type:'string',placeholder:'name of component',noSuggestions:true},
			title:{type:'string',noSuggestions:true,description:'human friendly name of component'},
			description:{type:'richtext',placeholder:'component description',hideName:true},
			props:{type:'prop definition*',expanded:false},
			importLibrary:{type:'string',noSuggestions:true,title:'import library'},
			importIdentifier:{type:'string',noSuggestions:true,title:'import identifier'}
		},
	},
	{
		name:'type definition',
		show:['name','description'],
		key:'name',
		pattern:"<<name>>",
		properties:{
			name:{type:'string',placeholder:'name of type',noSuggestions:true},
			title:{type:'string',noSuggestions:true,description:'human friendly name of type'},
			description:{type:'richtext'},
		}
	},
	{
		name:'prop definition',
		key:'name',
		properties:{
			name:{type:'string',noSuggestions:true,placeholder:'property name'},
			title:{type:'string',noSuggestions:true,placeholder:'human friendly name'},
			type:{type:'string',noSuggestions:true,placeholder:'type of property'},
			description:{type:'richtext',hideName:true}
		},
		pattern:'<<name>> of type <<type>>',
		show:['title','description']
	}
]

function registerPackage(dictionary,script,pkg){
	(script.components||[]).forEach(component=>registerComponent(component,dictionary,pkg));
}

function registerComponent(component,dictionary,pkg){
	const props = generateProps(component,component.props||[]);
	const display = generateComponentDisplay(component);
	const pattern = component.patten || `${component.title||component.name} referenced as <<ref>>`;
	const childrenProperty = generateChildrenProperty(component);
	dictionary._registerType(props.name,props,pkg);
	const ret = {
		name:component.name,
		title:component.title,
		description:component.description,
		properties:{
			props:{
				type:props.name,
				title:'properties',
				description:'Specify the properties of the component',
				init:{$type:props.name},
				init:{$type:props.name},
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
					path:'..',
					base: component.title,
					type: 'component'
				}
			},
		},
		context: [
			{$type:'use context',path:'display'},
			{$type:'use context',path:'props'},
			{$type:'use context',path:'children/*'},
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

	if(childrenProperty){
		ret.properties.children = childrenProperty;
	}
	ret.show = generateShow(component,ret,props);

	//registrations
	dictionary._registerType(props.name,props,pkg);
	dictionary._registerType(display.name,display,pkg);
	dictionary._registerType(ret.name,ret,pkg);
	dictionary._registerIsa(component.name,'component');
	dictionary._registerFunction(component.name,generateComponentFn(component),pkg);
}

function generateProps(component,props){
	return {
		name: 'props.' + component.name,
		properties:generatePropsProperties(props)
	}

}

function generatePropsProperties(props){
	const ret = {};
	props.forEach(prop=>{
		ret[prop.name] = {
			type:prop.type,
			title:prop.title || prop.name,
			description:prop.description
		}
	})
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
	if(component.slots && component.slots.find(slot=>(slot.name==='default' || slot.name === undefined))){
		const slot = component.slots.find(slot=>(slot.name==='default' || slot.name === undefined));
		return {
			type:{
				$type:'role type',
				role:'type',
				type:(slot.type||'component') + '*',//accept an array of type
			},
			expanded:true,
			title: (slot.title && slot.title !=='default')? slot.title : 'children',
			description:slot.description,
			childSpec: {
				context: [{
					$type: "use context",
					path: "../.."
				}]
			}
		}
	}else{
		return undefined;
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
		ret.push('children')
	}
	return ret;
}

function generateComponentFn(component){
	return {
		component:true,
		type:'constant',
		importLibrary:component.importLibrary,
		name: component.importIdentifier || component.name
	}
}