/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import packageDef from './package-def.js'
import {JsonPointer} from 'json-ptr'
import { validators } from "../validate.js";
import actions from './actions.js'
import { Role } from "../role.js";

const entities = 	[
	{
		name:'any',
		isa:['property type']
	},
	{
		name:'action',
		role:'type'
	},
	{
		name:'copy type',
		description:'A type derived from the value of a property value. This can be used to derive the type of default value based on the type defined in the property spec',
		properties:{
			property:{
				description:'property to copy the value of type from. This is used to define a type that is copied from a property value'
			}
		}
	},
	{
		name:'package',
		show:['name','description','actions','events','expressions','entities','properties','traits'],
		properties:{
			name:{type:'text',placeholder:'Package name'},
			description:{type:'richtext'},
			traits:{type:'trait*',expanded:true},
			properties:{type:'property*',expanded:true},
			expressions:{
				type:'expression definition group',
				title:'expressions',
				description:'List of expressions defined in this package',
				displayInline:false,
				expanded:true,
				init:{
					$type:'expression definition group',
					name:'expressions'
				}
			},
			entities:{
				type:'entity definition group',
				title:'application types',
				description:'List of application types that may be used in the application.',
				displayInline:false,
				expanded:true,
				init:{
					$type:'entity definition group',
					name:'entity types'
				}
			},
			propertyTypes:{
				type:'property definition group',
				title:'property types',
				description:'List of property types defined in this package',
				displayInline:false,
				expanded:true,
				init:{
					$type:'property definition group',
					name:'property types'
				}
			},
			events:{
				type:'event definition group',
				title:'events',
				description:'List of events defined in this package',
				displayInline:false,
				expanded:true,
				init:{
					$type:'event definition group',
					name:'events'
				}
			},
			actions:{
				type:'action definition group',
				description:'List of actions defined in this package',
				displayInline:false,
				expanded:true,
				init:{
					$type:'action definition group',
					name:'actions',
				}
			}
		}
	},
	{
		name:'entity definition',
		placeholder:'Click to choose the type of entity you want to create',
		properties:{
			role:{
				options:['calc','artifact','value'],
				description:'mark the role of this entity. Expressions that are defined as role=calc are not displayed in suggestions unless filter starts with ='
			}
		}
	},
	{
		name:'calculated expression',
		isa:['expression definition'],
		title:'calculated expression',
		pattern:'<<pattern>> (<<valueType>>)',
		show:['name'],
		properties:{
			valueType:{placeholder:'value type',type:'string'},
			name:{type:'name'}
		}
	},
	{
		name:'object entity definition',
		isa:['property definition'],
		title:'Object Entity (has properties)',
		pattern: "<<name>>",
		show:['pattern','name','title','description','isa','properties','show'],
		additional:['expanded','context','emitOrder','scope','traitType','actions','inlineDetails'],
		properties:{
			name:{
				type:'name',
				placeholder:'type name',
				default:(spec)=>{
					if(spec && typeof spec === 'object'){
						return spec.pattern;
					 }else{
						 return undefined
					 }
				}
			},
			description:{type:'richtext'},
			pattern:{type:'name',placeholder:'property pattern',description:'the pattern used to show the property'},
			emitOrder:{type:'name*'},
			isa:{type:'name*',template:'{{this}}',title:'is a'},
			hashSpec:{type:'property spec'},
			traitType:{
				type:'name',
				default:(spec)=>{
					if(spec && typeof spec === 'object' && (spec.name || spec.type)){
						return (spec.name || spec.type) + ' trait';
					 }else{
						 return 'trait'
					 }
				}
			},
			inlineDetails:{
				options:['collapsed','expanded','none']
			},
			properties:{
				hashSpec:{type:'property spec'},
				expanded:true,
				type: 'hash'
			},
			show:{type:'name*',template:'{{this}}'},
			mustShow:{
				type:'boolean',
				viewer:'boolean-viewer',
				description:
					'Determine if the "show" properties should be displayed' +
					' after initializing the entity with the inline pattern.'
			},
			context:{type:'context entry*'},
			scope:{type:'scope entry*'},
			expanded:{type:'boolean'},
			title:{type:'text',placeholder:'name of the entity',description:'This will be used instead of the pattern when displaying suggestions'},
			actions:{type:'entity action*',expanded:true}
		}
	},
	{
		name:'selection entity',
		isa:['property definition'],
		description:'An entity that its value can be one of a predefined list of strings',
		show:['description','options'],
		pattern:'<<type>> - a selection',
		properties:{
			type:{type:'text',placeholder:'Name of the type'},
			options:{type:'text*',expanded:true},
			description:{type:'richtext',placeholder:'Type description here'}
		}
	},
	{
		name:'id',
		isa:['string','property type'],
		textEditor:true
	},
	{
		name:'trait assertion',
		isa:['expression']
	},
	{
		name: 'condition',
		pattern:'<<subject>> <<trait>>',
		properties:{
			subject:{
				type:{
					$type:'role type',
					type:'condition subject',
					role:'instance'
				},
				description:'Specify the entity you want to test',
				placeholder:'entity to test'
			},
			trait:{
				placeholder:'entity trait',
				description:'Specify the trait of the entity you want to test for. Example, for a text entity, the trait can be "starts with ______" or "longer than _____ characters"',
				type:function({$location}){
					const valueType = $location.parent.child('subject').valueType;
					if(!valueType){
						return 'none';
					}
					return {
						$type:'role type',
						type:`trait<${valueType.searchString}>`,
						role:'type'
					}
				}
			}
		}
	},
	{
		name:'and condition',
		title:'and',
		pattern:'and <<condition>>',
		isa:['additional condition'],
		properties:{
			condition:{type:'condition'}
		}
	},
	{
		name:'or condition',
		title:'or',
		pattern:'or <<condition>>',
		isa:['additional condition'],
		properties:{
			condition:{type:'condition'}
		}
	},
	{
		name:'conditional value item',
		pattern:'when <<condition>> <<additionals>> the value is <<value>>',
		properties:{
			condition:{
				type:'condition',
				description:'specify the condition when true the value of the expression is <value>'
			},
			additionals:{
				type:'additional condition*',
				placeholder:'additional condition',
				description:'add an additional condition that must be true (and) or an alternative condition (or)',
				firstNewItemCollapsed: true
			},
			value:{
				description:'The value of the expression when the condition is true',
				type(context){
					return context.$location.parent.parent.parent.expectedType;
				}
			}
		}
	},
	{
		name:'conditional value',
		title:'conditional value',
		description:'Specify the value of an expression that depends on one or more conditions',
		template:'conditional value ...',
		expanded:true,
		show:['items','default'],
		inlineDetails:'expanded',
		role:'calc',
		valueType:'?',
		suggest:{
			alt:[],
			requiredContext:'condition subject'
		},
		properties:{
			items:{
				type:'conditional value item*',
				expanded:true,
				hideName:true,
				childSpec:{
					displayInline:true
				}
			},
			default:{
				placeholder:'default value',
				description:'Default value when no condition is true',
				type(context){
					return context.$location.parent.expectedType;
				}
			}
		}
	},
	{
		name:'javascript expression',
		title:'javascript expression',
		template: 'Javascript Expression',
		valueType:'?',
		role:'calc',
		viewer:'code-expression'
	},
	{
		name:'javascript function',
		$generic: 'javascript expression',
		title:'javascript function',
		isa:['action'],
		viewer:'code-expression'
	},
	{
		name:'basic event definition',
		isa:'event definition',
		title:'event definition',
		pattern:'<<name>>',
		show:['pattern','description','properties','context'],
		additional:['show','fn'],
		properties:{
			pattern:{type:'pattern',placeholder:'Type in the event pattern',description:'The event pattern is how the pattern is refered to. E.g. user clicks on <<element>>'},
			description:{type:'richtext'},
			properties:{hashSpec:{type:'property spec'},expanded:true},
			context:{expanded:false,type:'context entry*'},
			show:{type:'string*'},
			fn:{
				type:'text',
				description:'A reference to the registering event function. The function is described in the format of `functionName@package(arg1,arg2) where args are names of properties. The registering function will be called where `this` is the callback function to register.'
			}
		},
	},
	{
		name:'event handler',
		description:`An event handler. The event handler calls the event function with <code>this</code> object that has the following properties:<ul>
		<li>registerEvent - a function that registeres and event. It takes the following arguments: target,eventName, handler
		<li>handler - the function to execute
		</ul>
		It is important to use the registerEvent function because it takes care of unregistering event in case of development environment with hot reload
		`,
		pattern:'when <<event>> then <<action>>',
		suggest:{tag:'core'},
		properties:{
			event:{
				type:'event',
				placeholder:'Triggering event',
				description: 'Select the event to trigger the action',

			},
			action:{
				type:'action',
				hideName:true,
				displayInline:false,
				placeholder:'action to perform',
				description:'Select <b>action</b> to perform when the event is triggered (when event occurs)'
			}
		},
		emitOrder:['event','action'],
		scope:[
			{$type:'use scope',path:'event'}
		],
		context:[
			{$type:'use context',path:'event'}
		]
	},
	{
		name:'text',
		isa:['string','property type','data type'],
		textEditor:true,
		placeholder:'Enter the text'
	},
	{
		name:'context entry',
	},
	{
		name:'pattern',
		isa:['string','property type'],
		textEditor:true
	},
	{
		name:'basic emit',
		isa:['context entry','scope entry'],
		pattern:'emit a <<type>> referenced as <<name>> accessed as <<access>>',
		properties:{
			access:'text',
			property:'text',
			type:{type:'text',placeholder:'entity type'},
			name:{type:'pattern'},
			useScope:{type:'boolean',description:'Use the scope of the emited object. If set to true then scope search iterates through the type scope entries or scope function'},
			description:{type:'richtext'}
		}
	},
	{
		name:'emit hash',
		isa:['context entry','scope entry'],
		description:'Emit a hash property. The values are emited using their property name as name. If the items are not instances, then emit their instances',
		pattern:'emit hash <<property>> accessed as <<access>>',
		properties:{
			property:{type:'name',description:'the name of the hash property'},
			proxyFor:{type:'name',description:'When the hash values are proxies for a property of theirs then need to also emit the proxy with the property name',title:'proxy for'},
			access:{type:'text'}
		}
	},
	{
		name:'emit component',
		isa:['scope entry'],
		description:'emit all child components of this component'
	},
	{
		name:'scope entry',
		placeholder:'add to scope of this entity'
	},
	{
		name:'use scope',
		description:'use a scope of property where property is a type',
		pattern:'use scope of <<path>> accessed as <<access>>',
		isa:['scope entry','context entry'],
		properties:{
			access:{type:'text',placeholder:'access to entity from scope'},
			path:{type:'name',placeholder:'path'}
		}
	},
	{
		name:'emit property',
		pattern:'emit property <<property>> accessed as <<access>>',
		isa:['context entry'],
		properties:{
			access:{type:'text',placeholder:'access to entity from scope'},
			property:{type:'name',placeholder:'property to emit'}
		}
	},
	{
		name:'reference',
		template: '{{label}}',
		inlineClass:'text-primary'
	},
	{
		name:'property spec',
		description: 'Specification of an object property.',
		pattern:'<<type>>',
		show:['type','placeholder'],
		additional:['description','default','expanded','required','hashSpec','readonly','title','actions','namePlaceholder','hideName','displayInline'],
		properties:{
			type:{type:'string',placeholder:'property type'},
			placeholder:{type:'string'},
			expanded:{type:'boolean'},
			hashSpec:{type:'property spec',placeholder:'Define type for dictionary objects'},
			default:{
				description:'default value of the property in case no value was explicitly set. Default can be an expression that is recalculated dynamically when the property value is checked for',
				placeholder:'Default value of the property',
				type: {$type:'copy type',path:'type'}
			},
			init:{description:'value to initialize the property with. The init value is only set at initialization of the object'},
			description:{type:'richtext',placeholder:'Description fo the property'},
			actions:{type:'entity action*',expanded:true},
			readonly:{type:'boolean'},
			namePlaceholder:{type:'name',title:'name placeholder',placeholder:'name to use for hash property'},
			childSpec:{
				type:'property spec',
				description:'Define spec for properties array items'
			},
			title:{type:'text',title:'title'},
			required:{type:'boolean'},
			hideName:{
				type:'boolean',
				description:'hide the name of the property. Unless displayInline is explicitly set to true, this also hides the inline value'
			},
			displayInline:{
				type:'boolen',
				description:'Determine if this property should display inline. If set to true then the inline value is displayed (even if hideName is set to true). If value is set to false then the inline value will not be displayed'
			},
			context:{
				type:'context entry*',
				description:'Define context for this property. This can be used for adding event argument in event handlers'
			},
			firstNewItemCollapsed:{
				type:'boolean',
				description:'Set true if when the property is an array and it appears inline, the first item when not initialized should be collapsed using the ^ sign. The default is for it to be expanded i.e. showing an empty item rather than a ^ sign.'
			},
			noSuggestions:{
				type:'boolean',
				description:'If set then do not show suggestions for this property'
			},
			suggestExpressions:{
				type:'boolean',
				description:'by default show expressions in suggestions menu, without requiring user to type "="'
			},
			unique:{
				type:'uniqe spec',
				description:'initialize the property with a unique name in a specified location context'
			}
		}
	},
	{
		name:'unique spec',
		description:'Specify how to initialize a unique name',
		properties:{
			base:{type:'string',description:'The base name to use. If this name does not exist in the context then just use it. If it exists then add an integer to it that does nott already appear'},
			path:{type:'string',description:'The path in which to check the uniqueness of the name'},
			type:{type:'type',description:'The context search type to use to evaluate which names are already in use'}
		}
	},
	{
		name:'script',
		description:'default script. set the package to the package defining the script type you would like to use',
		show:['name','description','packages'],
		properties:{
			packages:{type:'string*',expanded:true},
			name:{type:'string'},
			description:{type:'richtext'}
		}
	},
	{
		name:'subtype definition',
		isa:['property definition'],
		title:'subtype definition',
		description:'Define the relationship between two types. The types may be new or can be predefined types that their relationship was not established yet',
		pattern:'<<subtype>> is a type of <<supertype>>',
		properties:{
			subtype:{
				type:'name'
			},
			supertype:{
				type:'name'
			}
		},
		register:function(dictionary,type,spec){
			if(spec.subtype && spec.supertype){
				dictionary._registerIsa(spec.subtype,spec.supertype);
			}
		}
	},
	{
		name:'richtext',
		isa:['property type'],
		viewer: 'richtext-editor',
	},
	{
		name:'boolean',
		isa:['application type'],
		placeholder:'true/false',
		viewer:'boolean-viewer',
		suggestExpressions:true
	},
	{
		name:'name',
		isa:['string','property type'],
		placeholder:'Enter the name'
	},
	{
		name:'url',
		isa:['string','property type'],
		placeholder:'Enter URL'
	},
	{
		name:'basic action definition',
		isa:'action definition',
		title:'define an action',
		pattern:'<<pattern>>',
		show:['pattern','description','properties','do'],
		additional:['show','emitOrder','context'],
		placeholder:'Click to choose the type of action to define',
		properties:{
			description:{type:'richtext'},
			pattern:{type:'pattern',placeholder:'pattern to use for this action'},
			properties:{hashSpec:{type:'property spec'}},
			emitOrder:{type:'string*'},
			do:{type:'action'},
			show:{type:'string*'},
			context:{expanded:true,type:'context entry*'},
		}
	},
	{
		name:'expression'
	},
	{
		name:'data type',
		options:function({$location}){
			return $location.dictionary.getClassMembers('data type');
		}
	},
	{
		name:'dataset',
		genericProperties:['itemType']
	},
	{
		name:'entity type',
		options:function({$location}){
			return $location.dictionary.getClassMembers('entity type');
		}
	},
	{
		name:'entity action',
		description:'Actions defined per entity. They are displayed as button in the editor',
		pattern:'<<title>>',
		show:['title','description','hint','icon','type','action'],
		properties:{
			title:{type:'text',placeholder:'action title'},
			action:{type:'editor action'},
			description:{type:'richtext'},
			icon:{type:'text',placeholder:'name of icon',description:'name of material icon to use'},
			hint:{type:'text'},
			type:{
				options:['button','upload'],
				default:'button'
			},
		}
	},
	{
		name:'call service',
		isa:['editor action'],
		exec(context,{postMessage,component}){
			return postMessage(this.topic,this.message,component);
		}
	},
	{
		name:'post message',
		description:'Post a message to the containing application or server. This is an editor action that is activated by clicling an entity action icon or button. If message is specified then it is treated as a path to object to send. Otherwise, the function passes the location value',
		show:['topic','message'],
		isa:['editor action'],
		exec(context,{postMessage,component}){
			function getLocations(message){
				const paths = message.split(',')
					.map(item=>item.trim())
					.map(item=>item[0]!=='/'? '/'+item : item);
				const values = paths.map(path=>calcPath(context,path))
				return values.length===1?values[0] : values;
			}
			const message = getLocations(this.message||'');
			return postMessage(this.topic,message,component);
		},
		properties:{
			topic:{type:'text'},
			message:{type:'text',description:'message to send. If message is not specified then send the triggering entity'}
		}
	},
	{
		name:'hat action',
		description:'An entity action that is activated by clicking an icon that appears above the inline-value',
		pattern:'<<title>>',
		show:['hint','icon','action'],
		properties:{
			action:{type:'editor action'},
			icon:{type:'text',placeholder:'name of icon',description:'name of material icon to use'},
			hint:{type:'text',description:'The tooltip for the hat icon'},
		}
	},
	{
		name:'definition model',
		properties:{
			isa:{
				type:'string*',
				template:'{{this}}',
				title:'type of',
				default:(context)=>{
					if(!context){
						return;
					}
					const location = context.$location;
					const name = location.parent.parent.value.name;
					if(typeof name !== 'string'){
						return;
					}
					return location.lang.singular(name);
				}
			}
		},
		show:['isa']
	},
	{
		name:'atom',
		isa:['property definition'],
		pattern:'<<name>>',
		properties:{
			name:{type:'name',placeholder:'Atom name'}
		},
		title:'Atom'
	},
	{
		name:'property definition group',
		title:'property folder',
		isa:['definition group','property definition'],
		inlineClass:'folder',//class used to display inline value
		properties:{
			name:{
				type:'text',
				placeholder:'category name (plural)',
				description:'The category name as plural of member type. E.g. color'
			},
			model:{
				type:'definition model',
				default:defaultDefinitionModel
			},
			members:{
				type:'property definition*',
				expanded:true,
				hideName:true,
				childSpec:{
					placeholder:'Define new property type'
				}
			}
		},
		show:['members'],
		additional:['model'],
		pattern:'<<name>>'
	},
	{
		name:'expression definition group',
		title:'expression folder',
		isa:['definition group','expression definition'],
		inlineClass:'folder',//class used to display inline value
		properties:{
			name:{
				type:'text',
				placeholder:'category name (plural)',
				description:'The category name as plural of member type. E.g. element expressions'
			},
			model:{
				type:'definition model',
				default:defaultDefinitionModel
			},
			members:{
				type:'expression definition*',
				expanded:true,
				hideName:true,
				childSpec:{
					placeholder:'Define new expression'
				}
			}
		},
		show:['members'],
		additional:['model'],
		pattern:'<<name>>'
	},
	{
		name:'event definition group',
		title:'event group',
		isa:['definition group','event definition'],
		inlineClass:'folder',//class used to display inline value
		properties:{
			name:{
				type:'text',
				placeholder:'group name (plural)',
				description:'The group name as plural of member type. E.g. mouse events'
			},
			model:{
				type:'definition model',
				default:{isa:['event']}
			},
			members:{
				type:'event definition*',
				expanded:true,
				hideName:true,
				childSpec:{
					placeholder:'Define new event'
				}
			}
		},
		show:['members'],
		additional:['model'],
		pattern:'<<name>>'
	},
	{
		name:'action definition group',
		isa:['definition group','action definition'],
		pattern:'<<name>>',
		inlineClass:'folder',//class used to display inline value
		title:'action group',
		properties:{
			name:{type:'text',placeholder:'action group name'},
			model:{
				type:'definition model',
				default: defaultDefinitionModel
			},
			members:{type:'action definition*',expanded:true,hideName:true}
		},
		show:['members'],
		additional:['model']
	},
	{
		name:'js instance',
		register:function(dictionary,type,spec){
			dictionary._registerInstance({
				name:spec.id,
				valueType:spec.type,
				value:spec.value,
				label:spec.label,
				description:spec.description
		})
		}
	},
	{
		name:'js action',
		show:['title','pattern','description','properties','call'],
		pattern:'<<name>>',
		properties:{
			title:{type:'text'},
			name:{type:'text'},
			pattern:{type:'pattern'},
			description:{type:'richtext'},
			properties:{title:'parameters',hashSpec:{type:'js prop',placeholder:'type of parameter'}},
			call:{title:'function',type:'string',noSuggestions:true,placeholder:'Python function to call'}
		}
	},
	{
		name:'js expression',
		show:['title','pattern','description','properties'],
		pattern:'<<name>>',
		properties:{
			title:{type:'text'},
			name:{type:'text'},
			pattern:{type:'pattern'},
			description:{type:'richtext'},
			properties:{title:'parameters',hashSpec:{type:'js prop'}}
		}
	},
	{
		name:'js event',
		show:['title','pattern','description','properties'],
		pattern:'<<name>>',
		properties:{
			title:{type:'text'},
			name:{type:'text'},
			pattern:{type:'pattern'},
			description:{type:'richtext'},
			properties:{title:'parameters',hashSpec:{type:'js prop'}}
		}
	},
	{
		name:'js type',
		show:['title','description','properties'],
		additional:['hat'],
		pattern:'<<name>>',
		properties:{
			title:{type:'text'},
			name:{type:'text'},
			properties:{title:'properties',hashSpec:{type:'js prop'}},
			description:{type:'richtext'},
			hat: {type:'hat action'}
		}
	},
	{
		name:'js trait',
		show:['name','description','subject','properties'],
		pattern:'<<subject>> <<pattern>>',
		properties:{
			subject:{type:'text',readonly:true,inlineClass:'text-bold',placeholder:'trait subject'},
			title:{type:'text'},
			pattern:{type:'pattern'},
			name:{type:'text'},
			description:{type:'richtext'},
			properties:{title:'parameters',hashSpec:{type:'js prop'}}
		}
	},
	{
		name:'js type prop',
		title:'application type',
		isa:['js prop'],
		pattern:'<<type>>',
		show:['title','description','placeholder'],
		properties:{
			type:{type:'type',placeholder:'type of the parameter'},
			title:{type:'text',placeholder:'title of parameter',description:'the user friendly name of the parameter'},
			description:{type:'richtext'},
			placeholder:{type:'strtexting',placeholder:'placeholder to use for parameter value'}
		}
	},
	{
		name:'js options prop',
		title:'selection type',
		pattern:'one of <<options>>',
		isa:['js prop'],
		show:['title','description','placeholder'],
		properties:{
			title:{type:'text',placeholder:'title of parameter',description:'the user friendly name of the parameter'},
			description:{type:'richtext'},
			placeholder:{type:'text',placeholder:'placeholder to use for parameter value'},
			options:{type:'text*',childSpec:{placeholder:'add option'}}
		}
	}
]

export default {
	name:'base',
	entities:{
		$type:'entity definition group',
		members:[
			...entities,
			...actions,
			...validators,
			...packageDef
		],
		model:{isa:[]}
	}
}

function calcValueType({$location}){
	//valueType of expression
	const expressionLocation = $location.sibling('expression');
	const valueTypeLocation = expressionLocation.child('valueType');
	const valueType = valueTypeLocation.value;
	return valueType || 'any'
}

//add basic types
//entities.push(...basicTypes);


function defaultDefinitionModel(context){
	if(!context){
		return {$type:'definition model'};
	}
	const location = context.$location;
	if(typeof location.parent.value !== 'object'){
		return {$type:'definition model'};
	}
	const name = location.parent.value.name;
	if(typeof name !== 'string'){
		return {$type:'definition model'} ;
	}
	return {$type:'definition model',isa:[location.lang.singular(name)]};
}

function calcPath(context,path){
	if(path==='/'){
		path='';
	}
	const val = JsonPointer.get(context,path);
	const ret =  val && typeof val === 'object' && val.$isProxy? val.$value : val;
	//check again if ret is a proxy then evaluate it. We do not do this recursivly so we don't get into infinite loop
	return ret && typeof ret === 'object' && ret.$isProxy? ret.$value : ret;
}