import { specIsa } from "../spec";

const entities = 	[
	{
		type:'any',
		isa:['property type']
	},
	{
		type:'copy type',
		description:'A type derived from the value of a property value. This can be used to derive the type of default value based on the type defined in the property spec',
		properties:{
			property:{
				description:'property to copy the value of type from. This is used to define a type that is copied from a property value'
			}
		}
	},
	{
		type:'package',
		show:['name','description','entityTypes','propertyTypes','events','expressions','actions'],
		properties:{
			name:{type:'string',placeholder:'Package name'},
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
				title:'entity types',
				description:'List of entity types defined in this package',
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
		type:'entity definition',
		placeholder:'Click to choose the type of entity you want to create'
	},
	{
		type:'calculated expression',
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
		type:'object entity definition',
		isa:['entity definition','property definition'],
		title:'Object Entity (has properties)',
		pattern: "<<type>>",
		show:['pattern','type','title','description','isa','properties','show'],
		additional:['expanded','emits','emitOrder','traitType','instanceType','actions','inlineDetails'],
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
			inlineDetails:{
				options:['collapsed','expanded','none']
			},
			instanceType:{
				type:'string',
				default:(spec)=>{
					if(spec && typeof spec === 'object' && (spec.name || spec.type)){
						const name = spec.name || spec.type;
						//TODO need to use linguistic library for this
						const useAn = ['a','i','o','u','h'].includes(name[0]);
						return (useAn?'an ':'a ') + name;
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
			const propertyLocation = location.parent.child(this.property).referenced;
			let spec;
			const propertyType = propertyLocation.type;
			if(specIsa(propertyLocation.spec,'expression')){
				spec = location.dictionary.getTypeSpec(propertyLocation.spec.valueType);
			}else{
				spec = propertyLocation.spec;
			}
			return spec.traitType || 'trait';
		},
		properties:{
			property:{type:'string',placeholder:'property associated with trait'}
		}
	},
	{
		pattern:'if <<condition>> then <<action>> otherwise <<alternateAction>>',
		name:'condition statement',
		isa:['action'],
		show:['action','alternateAction'],
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
			sequence:{type:'action*',expanded:true,hideName:true,required:true}
		}
	},
	{
		type:'basic event definition',
		isa:'event definition',
		title:'event definition',
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
		show:['action'],
		emitOrder:['event','action']
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
		name:'condition definition',
		title:'condition expression',
		isa:['expression definition'],
		pattern:'<<pattern>>',
		properties:{
			pattern:{type:'pattern',placeholder:'the condition pattern'},
			isa:{value:['condition']}
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
		show:['expression'],
		properties:{
			type:{type:'entity type',placeholder:'entity type'},
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
		show:['expression'],
		pattern:'emit a <<tag>> of type <<type>>',
		properties:{
			tag:{type:'string'},
			type:{type:'string',placeholder:'data type'}
		}
	},
	{
		type:'emit type entry',
		isa:['emit entry'],
		show:['expression'],
		properties:{
			type:{type:'string',placeholder:'entity type'}
		},
		pattern:'emit a <<type>>'
	},
	{
		type:'property spec',
		description: 'Specification of an object property.',
		pattern:'<<type>>',
		show:['type','placeholder'],
		additional:['description','default','value','expanded','required','hashSpec','emits','readonly','title'],
		properties:{
			type:{type:'string',placeholder:'property type'},
			placeholder:{type:'string'},
			expanded:{type:'boolean'},
			hashSpec:{type:'property spec',placeholder:'Define type for dictionary objects'},
			value:{
				description:"When the value property is specified, the value of the entity's property is always `value`. When generating a new instance of the entity, a get function is defined for the property using value. If value is a function then the getter is defined as the functino. Otherwise, it always returns value."
			},
			default:{
				description:'default value of the property in case no value was explicitly set. Default can be an expression that is recalculated dynamically when the property value is checked for',
				placeholder:'Default value of the property',
				type: {$type:'copy type',property:'type'}
			},
			init:{description:'value to initialize the property with. The init value is only set at initialization of the object'},
			description:{type:'richtext',placeholder:'Description fo the property'},
			emits:{type:'emit entry*'},
			readonly:{type:'boolean'},
			childSpec:{
				type:'property spec',
				description:'Define spec for properties array items'
			},
			title:{type:'text',title:'title'},
			required:{type:'boolean'}
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
		type:'entity type',
		options:function({$location}){
			return $location.dictionary.getClassMembers('entity type');
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
		isa:'expression',
		valueType:'string',
		pattern:'join <<elements>>',
		properties:{
			elements:'text*',
			childSpec:{
				placeholder:'text to join'
			}
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
