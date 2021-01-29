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
		fn:'elementMatching@natura/lib/front-end(selector)',
		valueType:'an element'
	},
	{
		name:'front end script',
		show:['interactions'],
		properties:{
			interactions:{type:'event handler*',expanded:true}
		}
	},
	{
		name:'change style',
		title:'change style of element',
		pattern:'change <<name>> of <<an element>> to <<value>>',
		fn:'changeStyle@natura/lib/front-end(an element,name,value)',
		isa:['action'],
		properties:{
			value:{
				type:'text',
				placeholder:'value of style'
			},
			name:{
				type:'style name',
				placeholder:'style property'
			}
		}
	}
]

registerEvent('click','user clicks on <<an element>>');
registerEvent('update','user updates <<an element>>');
registerEvent('dblClick','user double clicks on <<an element>>','double click event');
registerEvent('type','user types <<a key>> in <<an element>>',undefined,'a key,an element');
registerEvent('focus','<<an element>> is focused');
registerEvent('blur','<<an element>> is blurred');
registerEvent('contextmenu','user opens context menu on <<an element>>', 'context menu click');
registerEvent('mouseenter','mouse enters <<an element>>','mouse enter');
registerEvent('mouseleave','mouse leavs <<an element>>','mouse leave');
registerEvent('input','value of input <<an element>> changes');

registerStyle('background color','backgroundColor');
registerStyle('font color','color');
registerStyle('border style','borderStyle');
registerStyle('border width','borderWidth');
registerStyle('margin','margin');
registerStyle('font size','fontSize');
registerStyle('border color','borderColor');
registerStyle('font family','fontFamily');
registerStyle('font weight','fontWeight');







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
		fn:`on${name.substr(0,1).toUpperCase()}${name.substr(1)}@natura/lib/front-end(${args})`,
	})
}

function registerStyle(name,cssName,valueType='text'){
	cssName = cssName || name.split(' ').join('-')
	entities.push({
		name:name + '.style',
		title:name,
		fn:{
			value:cssName
		},
		isa:['style name']
	});
}