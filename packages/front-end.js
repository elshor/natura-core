const entities = [
	{
		name: 'log',
		title:'log message',
		isa:['action'],
		pattern:'log <<a string>>',
		fn:'log@natura/lib/front-end(a string)'
	},
	{
		name: 'alert',
		title:'alert message',
		isa:['action'],
		pattern:'alert <<a string>>',
		fn:'alert@natura/lib/front-end(a string)'
	},
	{
		name:'element by id',
		pattern:'element with id <<id>>',
		isa:['expression'],
		fn:'elementWithId@natura/lib/front-end(id)',
		valueType:'an element'
	},
	{
		name:'element matching selector',
		pattern:'element matching <<selector>>',
		isa:['expression'],
		properties:{
			selector:{type:'a string',placeholder:'selector to match'}
		},
		fn:'elementMatching@natura/lib/front-end(id)',
		valueType:'an element'
	},
	{
		name:'front end script',
		show:['interactions'],
		properties:{
			interactions:{type:'event handler*',expanded:true}
		}
	}
]

registerEvent('click','user clicks on <<an element>>');
registerEvent('update','user updates <<an element>>');
registerEvent('dblClick','user double clicks on <<an element>>','double click');
registerEvent('type','user types <<a key>> in <<an element>>',undefined,'a key,an element');
registerEvent('focus','<<an element>> is focused');
registerEvent('blur','<<an element>> is blurred');


export default {
	name:'data store',
	entities:{
		$type:'entity definition group',
		members:entities,
		model:{isa:[]}
	}
}

function registerEvent(name,pattern,title,args="an element"){
	entities.push({
		name:name +'.event',
		isa:['event'],
		title:title || (name + ' event'),
		pattern,
		fn:`on${name.substr(0,1).toUpperCase()}${name.substr(1)}@natura/lib/front-end({${args}})`,
	})
}