const entities = [
	{
		name:'front end script',
		show:['interactions'],
		properties:{
			interactions:{type:'event handler*',expanded:true}
		}
	},
]

export default {
	name:'data store',
	entities:{
		$type:'entity definition group',
		members:entities,
		model:{isa:[]}
	}
}
