export default [
	{
		name:'string',
		isa:['application type'],
		instanceType:'a string',
		placeholder:'text'
	},
	{
		name:'number',
		isa:['application type'],
		instanceType:'a number',
		placeholder:'number'
	},
	{
		name:'boolean',
		isa:['application type'],
		instanceType:'a boolean',
		placeholder:'true/false',
		viewer:'boolean-viewer'
	},
	{
		name:'string is',
		isa: ['trait.string'],
		pattern:'is <<a string>>'
	},
	{
		name:'string is not',
		isa:['trait.string'],
		pattern:'is not <<a string>>'
	},
	{
		name:'string starts with',
		isa:['trait.string'],
		pattern:'starts with <<a string>>'
	},
	{
		name:'number is',
		isa:['trait.number'],
		pattern:'is <<a number>>',
	},
	{
		name:'number gt',
		isa:['trait.number'],
		pattern:'is greater than <<a number>>'
	},
	{
		name:'number gte',
		isa:['trait.number'],
		pattern:'is greater than or equal to <<a number>>'
	},
	{
		name:'number lt',
		isa:['trait.number'],
		pattern:'is less than <<a number>>'
	},
	{
		name:'number lte',
		isa:['trait.number'],
		pattern:'is less than or equal to <<a number>>'
	},
	{
		name:'number eq',
		isa:['trait.number'],
		pattern:'is equals to <<a number>>'
	},
	{
		name:'number neq',
		isa:['trait.number'],
		pattern:'is not equal to <<a number>>'
	},
	{
		name:'boolean is',
		isa:['trait.boolean'],
		pattern:'is <<a boolean>>'
	},
	{
		name:'boolean is not',
		isa:['trait.boolean'],
		pattern:'is not <<a boolean>>'
	},
]
