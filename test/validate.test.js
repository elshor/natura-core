/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import Dictionary from '../dictionary.js'
import { createLocation } from '../location.js';
import Type from '../type.js'
import { isValidBasicType } from '../validate.js';
const pkg = {
	entities:{
		$type:'entity definition group',
		members:[
			{
				name:'top',
				properties:{
					a:{type:'first'},
					b:{type:'second'},
					c:{type:'x'},
					d:{type:'y'}
				}
			},
			{
				name:'first',
				basicType:'string',
				isa:['x']
			},
			{
				name:'second',
				basicType:'number',
				isa:['x']
			},
			{
				name:'third',
				basicType:'boolean',
				isa:['y']
			},
			{
				name:'fourth',
				isa:['y','x']
			},
			{
				name:'fifth'
			}
	],
	}
}

const dictionary = new Dictionary();
dictionary.load(pkg);

describe('validate basic types',()=>{
	const l = createLocation({$type:'top'},dictionary);
	it('should identify simple types',()=>{
		expect(isValidBasicType(l.child('a'),'string')).toBe(true);
		expect(isValidBasicType(l.child('a'),'number')).toBe(false);
	});
	it('should identify class members',()=>{
		expect(isValidBasicType(l.child('c'),'string')).toBe(true);
		expect(isValidBasicType(l.child('c'),'number')).toBe(true);
		expect(isValidBasicType(l.child('c'),'boolean')).toBe(false);
	})
})