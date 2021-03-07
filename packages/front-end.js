const entities = [
	{
		name:'front end script',
		show:['interactions'],
		properties:{
			interactions:{type:'event handler*',expanded:true}
		}
	},
	{
		name:'wix script',
		show:['content','interactions'],
		properties:{
			content:{title:'content connections',type:'content connection*',expanded:true},
			interactions:{type:'event handler*',expanded:true}
		}
	},
	{
		name:'content connection',
		pattern:'connect <<data>> to <<element>>',
		show:['n','mode','steps'],
		properties:{
			data:{
				placeholder:'select collection to connect',
				title:'number of items',
				type:'string'
			},
			element:{
				placeholder:'select repeater to connect',type:'string'
			},
			n:{type:'number',placeholder:'number of items to display',title:'number of items'},
			mode:{options:['read only','read-write'],type:'string',init:'read only'},
			steps:{type:'processing step*',placeholder:'define processing step such as filter or sort',expanded:true}
		}
	},
	{
		name:'processing step',
		placeholder:'processing step such as filter or sort'
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
