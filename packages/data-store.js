const entities = [
	{
		name:'data store',
		description:'Data Store is a package used to define all data sources in a project',
		show:['data sources'],
		properties:{
			'data sources':{
				type:'data source*',
				expanded:true
			}
		},
		register(dictionary,_,spec){
			(spec['data sources']||[]).forEach(source=>{
				dictionary._registerType('a data source',source);
				//TODO change to registerInstance
			})
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
