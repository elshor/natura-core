/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
export default [
	{
		pattern:'if <<condition>> then <<action>> otherwise <<alternateAction>>',
		name:'condition statement',
		description:'Test if a condition is true. If it is true then execution action. Otherwise eecute the alternate action if exists.',
		title:'condition statement',
		isa:['action'],
		role:'type',
		valueType:'action',
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
		expanded:true,
		valueType:'action',
		role:'type',
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
		name:'set',
		title:'set property',
		isa:'action',
		valueType:'action',
		role:'type',
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
	},
	{
		name:'repeat for each',
		pattern:'for each item in <<collection>> do <<actions>>',
		description:'Repeat a sequence of actions for each item in a collection. The current item can be referenced from the action script as "the item"',
		role:'type',
		isa:['action'],
		valueType:'action',
		title:'repeat for each',
		context:[{
			$type:'basic emit',
			type:{
				$type:'copy type',
				path:'$location.properties.collection.valueSpec.$specialized.dataType',
			},
			name:'{{the $location.properties.collection.valueSpec.$specialized.dataType}}',
			access:'{{$id}}-item',
			useScope:false,
			description:'the current item'
		}],
		properties:{
			collection:{
				type:'data collection',
				placeholder:'collection of items',
				description:'Select a collection of items you would like to repeat the action for',
			},
			actions:{
				type:'action*',
				placeholder:'actions to perform',
			}
		}
	}
]