/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
export default [
	{
		name:'string',
		isa:['application type'],
		placeholder:'text'
	},
	{
		name:'number',
		isa:['application type'],
		placeholder:'number'
	},
	{
		name:'boolean',
		isa:['application type'],
		placeholder:'true/false',
		viewer:'boolean-viewer'
	},
	{
		name:'string is',
		isa: ['trait.string'],
		pattern:'equals <<a string>>',
		fn:'is@natura/lib/base(a string)'
	},
	{
		name:'string is not',
		isa:['trait.string'],
		pattern:'does not equal <<a string>>',
		fn:'isNot@natura/lib/base(a string)'
	},
	{
		name:'string is empty',
		isa:['trait.string'],
		pattern:'is empty',
		fn:'stringIsEmpty@natura/lib/base()'
	},
	{
		name:'string is not empty',
		isa:['trait.string'],
		pattern:'is not empty',
		fn:'stringIsNotEmpty@natura/lib/base()'
	},
	{
		name:'string starts with',
		isa:['trait.string'],
		pattern:'starts with <<a string>>',
		fn:'stringIsNotEmpty@natura/lib/base(a string)'
	},
	{
		name:'number is',
		isa:['trait.number'],
		pattern:'is <<a number>>',
		fn:'is@natura/lib/base(a number)'
	},
	{
		name:'number gt',
		isa:['trait.number'],
		pattern:'is greater than <<a number>>',
		fn:'gt@natura/lib/base(a number)'
	},
	{
		name:'number gte',
		isa:['trait.number'],
		pattern:'is greater than or equal to <<a number>>',
		fn:'gte@natura/lib/base(a number)'
	},
	{
		name:'number lt',
		isa:['trait.number'],
		pattern:'is less than <<a number>>',
		fn:'lt@natura/lib/base(a number)'
	},
	{
		name:'number lte',
		isa:['trait.number'],
		pattern:'is less than or equal to <<a number>>',
		fn:'lte@natura/lib/base(a number)'
	},
	{
		name:'number eq',
		isa:['trait.number'],
		pattern:'is equals to <<a number>>',
		fn:'is@natura/lib/base(a number)'
	},
	{
		name:'number neq',
		isa:['trait.number'],
		pattern:'is not equal to <<a number>>',
		fn:'isNot@natura/lib/base(a number)'
	},
	{
		name:'boolean is true',
		isa:['trait.boolean'],
		pattern:'is true',
		fn:'isTrue@natura/lib/base()'
	},
	{
		name:'boolean is false',
		isa:['trait.boolean'],
		pattern:'is false',
		fn:'isFalse@natura/lib/base()'
	},
///////////////////////////////////////////////////////////////////////////////
//functions
///////////////////////////////////////////////////////////////////////////////
	{
		name:'trimmed',
		isa:['expression'],
		valueType:'a string',
		pattern:'<<a string>> trimmed',
		trimmed:'fn@natura/lib/base(a string)'
	},
	{
		name:'trimmed start',
		isa:['expression'],
		valueType:'a string',
		pattern:'<<a string>> trimmed start',
		fn:'trimmedStart@natura/lib/base(a string)'
	},
	{
		name:'trimmed end',
		isa:['expression'],
		valueType:'a string',
		pattern:'<<a string>> trimmed end',
		fn:'trimmedEnd@natura/lib/base(a string)'
	}
]



