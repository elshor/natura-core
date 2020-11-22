
const entities = 	[
	{
		type:'any',
		isa:['property type']
	},
	{
		type:'package',
		//show:['events','expressions','actions'],
		show:['name','description','entityTypes','events','actions'],
		properties:{
			name:{type:'string',placeholder:'Package name'},
			description:{type:'richtext'},
			expressions:{
				title:'definitions',
				type:'expression definition*',
				description:'List of expressions defined in this package',
				expanded:true
			},
			entityTypes:{
				type:'entity definition group',
				title:'entity types',
				description:'List of entity types defined in this package',
				displayInline:false,
				expanded:true,
				init:{
					$type:'entity definition group',
					name:'entity types'
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
		type:'entity definition',
		placeholder:'Click to choose the type of entity you want to create'
	},
	{
		type:'expression definition',
		placeholder:'Click to choose the type of expression you want to create'
	},
	{
		type:'entity type',
		title:'Entity Type (used as typeof other types)',
		isa:['entity definition'],
		description:'Used to group other types with the `isa` property',
		pattern:'<<type>>',
		properties:{
			type:{type:'string',placeholder:'name of type'}
		}
	},
	{
		type:'object entity definition',
		isa:['entity definition'],
		title:'Object Entity (has properties)',
		pattern: "<<type>>",
		show:['pattern','type','title','description','isa','properties','show'],
		additional:['expanded','emits','emitOrder','traitType','actions'],
		properties:{
			type:{type:'string', placeholder:'Entity type name'},
			description:{type:'richtext'},
			pattern:{type:'string',placeholder:'entity type name',description:'The name of the entity - can be a pattern'},
			emitOrder:{type:'string*'},
			isa:{type:'string*',template:'{{this}}',title:'is a'},
			hashSpec:{type:'property spec'},
			traitType:{
				type:'string',
				default:(spec)=>{
					if(spec && typeof spec === 'object' && (spec.name || spec.type)){
						return (spec.name || spec.type) + ' trait';
					 }else{
						 return 'trait'
					 }
				}
			},
			properties:{
				hashSpec:{type:'property spec'},
				expanded:true,
				type: 'hash'
			},
			show:{type:'string*',template:'{{this}}'},
			mustShow:{
				type:'boolean',
				description:
					'Determine if the "show" properties should be displayed' +
					' after initializing the entity with the inline pattern.'
			},
			emits:{type:'emit entry*'},
			expanded:{type:'boolean'},
			title:{type:'string',placeholder:'name of the entity',description:'This will be used instead of the pattern when displaying suggestions'},
			actions:{type:'entity action*',expanded:true}
		}
	},
	{
		type:'selection entity',
		isa:['entity definition'],
		description:'An entity that its value can be one of a predefined list of strings',
		show:['description','options'],
		pattern:'<<type>> - a selection',
		properties:{
			type:{type:'string',placeholder:'Name of the type'},
			options:{type:'string*',expanded:true},
			description:{type:'richtext',placeholder:'Type description here'}
		}
	},
	{
		type:'id',
		isa:['string','property type']
	},
	{
		type:'number',
		isa:[,'property type','data type']
	},
	{
		type:'trait assertion',
		isa:['expression']
	},
	{
		type:'property trait',
		pattern:'trait of <<property>>',
		isa:['a property type'],
		calc:function(context){
			const location = context.$location;
			const spec = location.parent.child(this.property).referenced.spec;
			return spec.traitType || 'trait';
		},
		properties:{
			property:{type:'string',placeholder:'property associated with trait'}
		}
	},
	{
		pattern:'if <<condition to test>> then <<action to perform>>',
		isa:['action'],
		properties:{
			'condition to test':{type:'condition',placeholder:'condition to test'},
			'action to perform':{type:'action',placeholder:'action to perform'}
		}
	},
	{
		name: 'action sequence to perform',
		template:'do the following actions',
		isa:['action'],
		show:['sequence'],
		properties:{
			sequence:{type:'action*',expanded:true,hideName:true}
		}
	},
	{
		pattern:'if <<condition to test>> then do the following',
		isa:['action'],
		show:['actions'],
		expanded:true,
		properties:{
			'condition to test':{type:'assertion',placeholder:'condition to test'},
			actions:{type:'action*',expanded:true,hideName:true}
		}
	},
	{
		type:'basic event definition',
		isa:'event definition',
		pattern:'<<pattern>>',
		show:['pattern','description','properties','emits'],
		additional:['show'],
		properties:{
			pattern:{type:'pattern',placeholder:'Type in the event pattern',description:'The event pattern is how the pattern is refered to. E.g. user clicks on <<element>>'},
			description:{type:'richtext'},
			properties:{hashSpec:{type:'property spec'},expanded:true},
			emits:{expanded:false,type:'emit entry*'},
			show:{type:'string*'}
		},
	},
	{
		type:'event handler',
		pattern:'when <<event>> then <<action>>',
		properties:{
			event:{type:'event'},
			action:{type:'action'}
		},
		show:['action']
	},
	{
		pattern:'a <<entity>> is <<trait>> when <<expression>>',
		isa:["expression definition"],
		show:['entity','trait','expression'],
		properties:{
			entity:{type:'type',placeholder:'choose entity type'},
			isa:{value:['trait assertion','assertion']},
			pattern:{value:({entity,trait})=>{
				return `<<${entity}>> is ${trait}`
			}}
		}
	},
	{
		name: 'the <<definition term>> is <<expression>> (<<valueType>>)',
		pattern:'the <<pattern>> is <<expression>> (<<valueType>>)',
		isa:["expression definition"],
		show:['description','pattern','expression'],
		additional:['forEachPhrase'],
		properties:{
			description:{type:'richtext'},
			pattern:{
				type:'pattern',
				title:'definition term',
				placeholder:'The term we are defininig',
				style:'font-weight:bold'
			},
			expression:{
				type:'expression',
				placeholder:'The expression the term is defined as'
			},
			valueType:{
				value: calcValueType
			},
			properties:{
				value:{
					valueType:{
						value:function({$location}){
							//valueType is derived from parent spec valueType
							const parentLocation = $location.parent;
							if(parentLocation){
								return parentLocation.spec.valueType || 'any'
							}else{
								return 'any';
							}
						},
						title:'value type'
					}
				}
			},
			forEachPhrase:{
				type:'text',
				title:'for each phrase',
				description:'The pattern form as it would appear in a for-each action - E.g. for each friend of the user'
			}
		}
	},
	{
		type:'text',
		isa:['string','property type','data type'],
		placeholder:'Enter the text'
	},
	{
		type:'emit entry',
	},
	{
		type:'pattern',
		isa:['string','property type'],
	},
	{
		type:'emit ref entry',
		isa:['emit entry'],
		pattern:'emit a <<type>> referenced as <<ref>>',
		properties:{
			type:{type:'data type',placeholder:'data type'},
			ref:{type:'pattern'}
		}
	},
	{
		type:'emit children',
		pattern:'emit children',
		isa:['emit entry']
	},
	{
		type:'emit property',
		pattern:'emit property <<property>>',
		isa:['emit entry'],
		properties:{
			property:{type:'string',placeholder:'property to emit'}
		}
	},
	{
		type:'reference',
		template: '{{label}}'
	},
	{
		type:'emit tag entry',
		isa:['emit entry'],
		pattern:'emit a <<tag>> of type <<type>>',
		properties:{
			tag:{type:'string'},
			type:{type:'data type',placeholder:'data type'}
		}
	},
	{
		type:'emit type entry',
		isa:['emit entry'],
		properties:{
			type:{type:'data type',placeholder:'data type'}
		},
		pattern:'emit a <<type>>'
	},
	{
		type:'property spec',
		description: 'Specification of an object property.',
		pattern:'<<type>>',
		show:['type','placeholder'],
		additional:['description','value','expanded','hashSpec','emits','readonly'],
		properties:{
			type:{type:'a property type',placeholder:'property type'},
			placeholder:{type:'string'},
			expanded:{type:'boolean'},
			hashSpec:{type:'property spec',placeholder:'Define type for dictionary objects'},
			value:{
				type:'any',
				description:"When the value property is specified, the value of the entity's property is always `value`. When generating a new instance of the entity, a get function is defined for the property using value. If value is a function then the getter is defined as the functino. Otherwise, it always returns value."
			},
			default:{description:'default value of the property in case no value was explicitly set. Default can be an expression that is recalculated dynamically when the property value is checked for'},
			init:{description:'value to initialize the property with. The init value is only set at initialization of the object'},
			description:{type:'richtext',placeholder:'Description fo the property'},
			emits:{type:'emit entry*'},
			readonly:{type:'boolean'},
			childSpec:{
				type:'property spec',
				description:'Define spec for properties array items'
			}
		}
	},
	{
		type:'script',
		description:'default script. set the package to the package defining the script type you would like to use',
		show:['name','description','packages'],
		properties:{
			packages:{type:'string*',expanded:true},
			name:{type:'string'},
			description:{type:'richtext'}
		}
	},
	{
		type:'richtext',
		isa:['property type'],
		viewer: 'richtext-editor',
	},
	{
		type:'boolean',
		isa:['property type'],
		viewer:'boolean-viewer'
	},
	{
		type:'name',
		isa:['string','property type'],
		placeholder:'Enter the name'
	},
	{
		type:'url',
		isa:['string','property type'],
		placeholder:'Enter URL'
	},
	{
		type:'basic action definition',
		isa:'action definition',
		title:'define an action',
		pattern:'<<pattern>>',
		show:['pattern','description','properties','do','emits'],
		additional:['show','emitOrder'],
		placeholder:'Click to choose the type of action to define',
		properties:{
			description:{type:'richtext'},
			pattern:{type:'pattern',placeholder:'pattern to use for this action'},
			properties:{hashSpec:{type:'property spec'}},
			emits:{expanded:true,type:'emit entry*'},
			emitOrder:{type:'string*'},
			do:{type:'action'},
			show:{type:'string*'}
		}
	},
	{
		type:'expression'
	},
	{
		type:'data type',
		options:function({$location}){
			return $location.dictionary.getClassMembers('data type');
		}
	},
	{
		type:'a property type',
		options:function({$location}){
			return $location.dictionary.getClassMembers('property type');
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
		name:'event definition group',
		title:'event group',
		isa:['definition group','event definition'],
		properties:{
			name:{
				type:'text',
				placeholder:'group name (plural)',
				description:'The group name as plural of member type. E.g. mouse events'
			},
			model:{
				type:'definition model',
				default:defaultDefinitionModel
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

function defaultDefinitionModel(context){
	if(!context){
		return {$type:'definition model'};
	}
	const location = context.$location;
	const name = location.parent.value.name;
	if(typeof name !== 'string'){
		return {$type:'definition model'} ;
	}
	return {$type:'definition model',isa:[location.lang.singular(name)]};
}
