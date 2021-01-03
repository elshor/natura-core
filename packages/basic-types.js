export default [
	{
		name:'string',
		isa:'application type',
		instanceType:'a string',
		placeholder:'text'
	},
	{
		name:'number',
		isa:'application type',
		instanceType:'a number',
		placeholder:'number'
	},
	{
		name:'boolean',
		isa:'application type',
		instanceType:'a boolean',
		placeholder:'true/false',
		viewer:'boolean-viewer'
	},
	{
		name:'string is',
		type: 'trait.string',
		pattern:'is <<a string>>'
	},
	{
		name:'string is not',
		type:'trait.string',
		pattern:'is not <<a string>>'
	},
	{
		name:'string starts with',
		type:'trait.string',
		pattern:'starts with <<a string>>'
	},
	{
		name:'number is',
		type:'trait.number',
		pattern:'is <<a number>>',
	},
	{
		name:'number gt',
		type:'trait.number',
		pattern:'is greater than <<a number>>'
	},
	{
		name:'number gte',
		type:'trait.number',
		pattern:'is greater than or equal to <<a number>>'
	},
	{
		name:'number lt',
		type:'trait.number',
		pattern:'is less than <<a number>>'
	},
	{
		name:'number lte',
		type:'trait.number',
		pattern:'is less than or equal to <<a number>>'
	},
	{
		name:'number eq',
		type:'trait.number',
		pattern:'is equals to <<a number>>'
	},
	{
		name:'number neq',
		type:'trait.number',
		pattern:'is not equal to <<a number>>'
	},
	{
		name:'boolean is',
		type:'trait.boolean',
		pattern:'is <<a boolean>>'
	},
	{
		name:'boolean is not',
		type:'trait.boolean',
		pattern:'is not <<a boolean>>'
	},
]
