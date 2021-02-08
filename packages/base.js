import basicTypes from "./basic-types.js"

const entities = 	[
	{
		name:'any',
		isa:['property type']
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
		show:['name','description','entityTypes','propertyTypes','events','expressions','actions'],
		properties:{
			name:{type:'text',placeholder:'Package name'},
			description:{type:'richtext'},
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
			entityTypes:{
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
		placeholder:'Click to choose the type of entity you want to create'
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
		additional:['expanded','context','emitOrder','scope','traitType','instanceType','actions','inlineDetails'],
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
			instanceType:{
				type:'string',
				default: defaultInstanceType
			},
			properties:{
				hashSpec:{type:'property spec'},
				expanded:true,
				type: 'hash'
			},
			show:{type:'name*',template:'{{this}}'},
			mustShow:{
				type:'boolean',
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
		isa:['string','property type']
	},
	{
		name:'trait assertion',
		isa:['expression']
	},
	{
		pattern:'if <<condition>> then <<action>> otherwise <<alternateAction>>',
		name:'condition statement',
		description:'Test if a condition is true. If it is true then execution action. Otherwise eecute the alternate action if exists.',
		title:'condition statement',
		isa:['action'],
		properties:{
			'condition':{type:'condition'},
			'action':{type:'action',placeholder:'action to perform', description:"Specify here the action to perform when the condition is true."},
			'alternateAction':{
				type:'action',
				placeholder:'action if condition is false',
				title:'otherwise'
			}
		}
	},
	{
		name: 'action sequence to perform',
		displayPattern:'do the following actions',
		inlineDetails:'expanded',
		isa:['action'],
		show:['sequence'],
		expanded:true,
		properties:{
			sequence:{
				type:'action*',
				expanded:true,
				hideName:true,
				required:true,
				placeholder:'action to perform',
				description:'Specify an action to perform. the actions will be executed in order, waiting for previous asynchronous action to complete (such as resource load)'
			}
		}
	},
	{
		name: 'condition',
		pattern:'<<subject>> <<trait>>',
		properties:{
			subject:{
				type:'application instance',
				placeholder:'subject to test'
			},
			trait:{
				placeholder:'subject trait',
				type:function({$location}){
					const valueType = $location.parent.child('subject').valueType;
					if(!valueType){
						return 'none';
					}
					const type = $location.dictionary.typeOfInstance(valueType) || valueType;
					return 'trait.' + type;
				}
			}
		}
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
			{$type:'use scope',property:'event'}
		]
	},
	{
		name:'text',
		isa:['string','property type','data type'],
		placeholder:'Enter the text'
	},
	{
		name:'context entry',
	},
	{
		name:'pattern',
		isa:['string','property type'],
	},
	{
		name:'basic emit',
		isa:['context entry','scope entry'],
		pattern:'emit a <<type>> referenced as <<name>> accessed as <<access>>',
		properties:{
			access:'text',
			type:{type:'text',placeholder:'entity type'},
			name:{type:'pattern'},
			useScope:{type:'boolean',description:'Use the scope of the emited object. If set to true then scope search iterates through the type scope entries or scope function'}
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
		name:'emit property',
		isa:['context entry'],
		pattern:'emit <<property>> referenced as <<name>>'
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
		pattern:'use scope of <<property>> accessed as <<access>>',
		isa:['scope entry','context entry'],
		properties:{
			access:{type:'text',placeholder:'access to entity from scope'},
			property:{type:'name',placeholder:'name of property'}
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
		template: '{{label}}'
	},
	{
		name:'property spec',
		description: 'Specification of an object property.',
		pattern:'<<type>>',
		show:['type','placeholder'],
		additional:['description','default','expanded','required','hashSpec','readonly','title','actions','namePlaceholder'],
		properties:{
			type:{type:'string',placeholder:'property type'},
			placeholder:{type:'string'},
			expanded:{type:'boolean'},
			hashSpec:{type:'property spec',placeholder:'Define type for dictionary objects'},
			default:{
				description:'default value of the property in case no value was explicitly set. Default can be an expression that is recalculated dynamically when the property value is checked for',
				placeholder:'Default value of the property',
				type: {$type:'copy type',property:'type'}
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
			required:{type:'boolean'}
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
		name:'entity definition group',
		title:'entity folder',
		isa:['definition group','entity definition'],
		inlineClass:'folder',//class used to display inline value
		properties:{
			name:{
				type:'text',
				placeholder:'category name (plural)',
				description:'The category name as plural of member type. E.g. mouse events or collection fields'
			},
			model:{
				type:'definition model',
				default:defaultDefinitionModel
			},
			members:{
				type:'entity definition*',
				expanded:true,
				hideName:true,
				childSpec:{
					placeholder:'Define new entity type'
				}
			}
		},
		show:['members'],
		additional:['model'],
		pattern:'<<name>>'
	},
	{
		name:'atom',
		isa:['property definition'],
		pattern:'<<name>>',
		show:['instanceType'],
		properties:{
			name:{type:'name',placeholder:'Atom name'},
			instanceType:{
				type:'name',
				title:'instance type',
				default:defaultInstanceType
			}
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
		name:'join text',
		title:'join text',
		fn:'join@natura/lib/base(elements)',
		isa:'expression',
		valueType:'a string',
		pattern:'join <<elements>>',
		properties:{
			elements:{
				type:'a string*',
				placeholder:'text to join'
			}
		}
	},
	{
		name:'property',
		description:'a property of an object. This is used to define setters and getters',
		properties:{
			name:{type:'string',description:'name of the property'},
			objectType:{type:'type',description:'the type of the object the property refers to'},
			pattern:{type:'pattern',description:'the pattern for displaying the property of the object. E.g. name of <<element>>. If pattern is not specified then use the format "<<property name>> of <<object>>'},
			valueType:{type:'type',description:'the value type of the property'},
			description:{type:'richtext',description:'Description of the property'},
			access:{type:'string',description:'The path to the property using > instead of . like in reference access'}
		},
		register(dictionary,_,spec){
			//get the pattern
			const pattern = spec.pattern || `${spec.name} of <<object>>`;
			const name = 'property.' + pattern;

			//add the pattern if does not exist
			//TODO need to fix this. valuetype should be'value.'+name and it shoule be a subtupe of valueType
			if(!dictionary.typeHasSpec(name)){
				dictionary._registerType(name,{
					name,
					pattern,
					isa:['expression','property accessor'],
					valueType:spec.valueType,
					description:spec.description,
					properties:{
						object:{type:'an object.'+name,placeholder:'the object'},
						access:{init:spec.access}
					}
				});
			}

			//tag object type
			dictionary._registerIsa(spec.objectType,'object.' + name);
			dictionary._registerInstanceType('an object.' + name,'object.'+name);
		}
	},
	{
		name:'set',
		title:'set property',
		isa:'action',
		description:'set a property value of an object.',
		pattern:'set <<prop>> to <<value>>',
		properties:{
			prop:{type:'property accessor',placeholder:'property to set'},
			value:{placeholder:'value to set',type:function({$location}){
				const prop = $location.sibling('prop');
				if(!prop){
					//property not set, return any
					return 'any instance';
				}
				const valueType = prop.spec.valueType;
				return valueType || 'any instance';
			}}
		}
	}
]

export default {
	name:'base',
	entities:{
		$type:'entity definition group',
		members:entities,
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

entities.push(...basicTypes);

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

function defaultInstanceType({location}){
	const spec = location? location.parent.value : {};
	if(spec && typeof spec === 'object' && (spec.name || spec.type)){
		const name = spec.name || spec.type;
		//TODO need to use linguistic library for this
		const useAn = ['a','i','o','u','h'].includes(name[0]);
		return (useAn?'an ':'a ') + name;
	}
}
