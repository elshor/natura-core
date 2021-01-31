import {locate} from '../context'
import Reference from '../reference'

const entities = [
	{
		name:'local storage',
		isa:['data source'],
		show:['settings','recordTypes'],
		register:registerLocalStorageSource,
		properties:{
			recordTypes:{
				title:'record types',
				description:'List of record types to store in local storage. Each record type has a list of fields.',
				type:'record type*',
				expanded:true
			},
			settings:{
				type:'setting*',
				expanded:true,
				description:"A list of settings stored in local storage. The settings can be used to determine the behavior of the website or web app"
			}
		}
	},
	{
		name:'setting',
		pattern:'<<name>> of type <<type>>',
		show:['description'],
		properties:{
			name:{type:'name',placeholder:'setting name'},
			type:{type:'local storage type',placeholder:'setting type'},
			description:{type:'richtext'}
		}
	},
	{
		name:'record type',
		pattern:'<<name>>',
		instanceType:'a record type',
		show:['fields'],
		additional:['plural'],
		properties:{
			name:{type:'name'},
			plural:{
				type:'name',
				default:function({$location}){
					return $location.lang.plural($location.parent.value.name);
				}
			},
			fields:{
				hashSpec:{
					type:'local storage type'
				}
			}
		},
	},
	{
		name: 'local storage type',
		instanceType:'a local storage type',
		options:[
			'string',
			'number',
			'boolean'
		]
	},
	{
		name:'all records',
		pattern:'all <<local storage record name>> records',
		fn:'query@natura/lib/local-storage(recordType,>filters)',
		scope:[
			{$type:'use scope',property:'a record type',access:'type'},
			{$type:'basic emit',type:'a record',name:'the record',access:'record'},
		],
		inlineDetails:'collapsed',
		isa:['expression'],
		show:['order'],
		properties:{
			order:{
				type:'sort order*',
				title:'ordered by',
				expanded:true,
				placeholder:'sort order',
				childSpec:{
					placeholder:'select sort order',
					options:function(context){
						const recordType = context.$location.parent.parent.child('a record type').referenced.value;
						if(!recordType || !recordType.fields){
							return [];
						}
						return Object.keys(recordType.fields)
							.map(name=>[name+' ascending',name+' descending'])
							.flat();
					}
				}
			}
		},
		valueType:'a data collection',
	},
	{
		name:'record query',
		isa:['expression'],
		fn:'query@natura/lib/local-storage(recordType,>filters)',
		inlineDetails:'collapsed',
		title:'local storage selected records',
		pattern:'selected <<recordType>> records',
		context:[
			{$type:'basic emit',type:'a record',name:'the record',access:'record',useScope:true},
			{$type:'emit property',property:'recordType',name:'the record type'}
		],
		properties:{
			recordType:{type:'local storage record name',placeholder:'record type'},
			filters:{
				expanded:true,
				title:'where',
				type:'local storage filter*'
			}
		},
		valueType:'a data collection',
		show:['filters']
	},
	{
		name:'conditional filter',
		fn:'conditionFilter@natura/lib/local-storage(condition,>local storage condition)',
		title:'conditional filter',
		show:[],
		isa:['local storage filter'],
		pattern:'when <<condition>> then filter by <<local storage condition>>'
	},
	{
		name:'local storage condition',
		title:'field filter',
		fn:'filter@natura/lib/local-storage(field,>trait)',
		isa:['local storage filter'],
		pattern:'<<field>> <<trait>>',
		properties:{
			field:{
				type:function({location}){
					const recordType = locate(location,undefined,'the record type') || '';
					return `a field.${recordType}.local storage`;
				},
				placeholder:'select field',
			},
			trait:{
				placeholder:'field condition',
				type:function({location}){
					const recordType = locate(location,undefined,'the record type') || '';
					const field = location.sibling('field').value || '';
					const type = location.dictionary.getInstanceByID(
						`type.${field}.${recordType}.local storage`
					) || 'string';
					return type + ' condition.local storage';
				}
			}
		}
	},
	{
		name:'string is.local storage',
		fn:'is@natura/lib/base(a string)',
		pattern:'equals <<a string>>',
		isa:['string condition.local storage']
	},
	{
		name:'string is not.local storage',
		fn:'isNot@natura/lib/base(a string)',
		pattern:'does not equal <<a string>>',
		isa:['string condition.local storage']
	},
	{
		name:'string starts with.local storage',
		fn:'stringStartsWith@natura/lib/base(a string)',
		pattern:'starts with <<a string>>',
		isa:['string condition.local storage']
	},
	{
		name:'string ends with.local storage',
		fn:'stringEndsWith@natura/lib/base(a string)',
		pattern:'ends with <<a string>>',
		isa:['string condition.local storage']
	},
	{
		name:'boolean is.local storage',
		fn:'isTrue@natura/lib/base(a string)',
		pattern:'is true',
		isa:['boolean condition.local storage']
	},
	{
		name:'boolean is not.local storage',
		fn:'isFalse@natura/lib/base(a string)',
		pattern:'is false',
		isa:['boolean condition.local storage']
	},
	{
		name:'add record',
		fn:'addRecord@natura/lib/local-storage(recordType,field setters)',
		isa:['action'],
		pattern:'add a new <<recordType>> record',
		inlineDetails:'collapsed',
		show:['field setters'],
		context:[
			{$type:'emit property',property:'recordType',name:'the record type'}
		],
		properties:{
			recordType:{
				type:'local storage record name',
				placeholder:'select record type',
				title:'record type'
			},
			'field setters':{
				type:'field setter*',
				required:true,
				expanded:true,
				hideName:true,
			}
		}
	},
	{
		name:'update record',
		fn:'updateRecord@natura/lib/local-storage(a record,field setters)',
		isa:['action'],
		pattern:'update <<a record>>',
		inlineDetails:'collapsed',
		show:['field setters'],
		context:[
			{
				$type:'use scope',
				property:'a record'
			}
		],
		properties:{
			'field setters':{
				type:'field setter*',
				required:true,
				expanded:true,
				hideName:true,
				displayInline:false
			}
		}
	},
	{
		name:'delete record',
		fn:'deleteRecord@natura/lib/local-storage(a record)',
		isa:['action'],
		pattern:'delete <<a record>>',
		context:[
			{
				$type:'use scope',
				property:'a record'
			}
		],
	},
	{
		name: 'local storage record name',
		placeholder:'select record type',
		options:({location})=>{
			return location.dictionary.getClassMembers('local storage record');
		}
	},
	{
		name:'field setter',
		fn:'fieldSetter@natura/lib/local-storage(field,value)',
		pattern:'set <<field>> to <<value>>',
		properties:{
			field:{
				type:function({location}){
					const recordType = locate(location,undefined,'the record type') || '';
					return `a field.${recordType}.local storage`;
				},
				title:'field',
				placeholder:'select field to set'
			},
			value:{
				placeholder:'the field value',
				type:function({location}){
					const recordType = locate(location,undefined,'the record type') || '';
					const field = location.sibling('field').value || '';
					const type = location.dictionary.getInstanceByID(
						`type.${field}.${recordType}.local storage`
					) || 'string';
					return 'a ' + type;
				}
			}
		}
	},
	{
		name:'record count',
		fn:'recordCount@natura/lib/local-storage(a data collection)',
		isa:['expression'],
		valueType:'a number',
		title:'record count',
		pattern:'number of records in <<a data collection>>'
	},
	{
		name:'computed data collection',
		fn:'computedDataCollection@natura/lib/data-store(a data collection)'
	}
]

export default {
	name:'data store',
	entities:{
		$type:'entity definition group',
		members:entities,
		model:{isa:[]}
	}
}

function registerLocalStorageSource(dictionary,_,spec){
	(spec.recordTypes||[]).forEach(recordType=>{
		//for each record type
		dictionary._registerType(recordType.name,{
			name:recordType.name,
			isa:['local storage record'],
			fields:Object.keys(recordType.fields),
			scope: Object.entries(recordType.fields)
				.map(([key,value])=>
					([
						{$type:'basic emit',type:'a field',name:key,value:key},
						{$type:'basic emit',type:'a '+value,name:key+' field',access:key}
					])
				).flat()
		});
		Object.entries(recordType.fields).forEach(([key,value])=>{
			dictionary._registerInstance(
				`${key}.${recordType.name}.local storage`,
				`a field.${recordType.name}.local storage`,
				key
			)
			dictionary._registerInstance(
				`type.${key}.${recordType.name}.local storage`,
				undefined,
				value
			)
		})
	});
	(spec.settings||[]).forEach(setting=>{
		dictionary._registerInstance(
			setting.name+'.settings.local storage',
			'a ' + setting.type,
			Reference(setting.name,'a '+setting.type,'#localStorage/setting/'+setting.name)
		);
	})
}
