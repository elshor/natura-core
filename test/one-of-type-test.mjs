/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import Dictionary from '../dictionary.js'
import Type from '../type.js'
const pkg = {
	entities:{
		$type:'entity definition group',
		members:[{
			name:'first',
			isa:['x']
		},
		{
			name:'second',
			isa:['x']
		},
		{
			name:'third',
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

describe('dictionary one of type',()=>{
	it('simple one-of - not categories',()=>{
		const type = Type({
			$type:'one of',
			types:['first','second']
		})
		expect(dictionary.isa('first',type)).toBe(true);
		expect(dictionary.isa('second',type)).toBe(true);
	})
	it('one-of categories',()=>{
		const type = Type({
			$type:'one of',
			types:['x','y','fifth']
		})
		expect(dictionary.isa('first',type)).toBe(true);
		expect(dictionary.isa('third',type)).toBe(true);
		expect(dictionary.isa('fifth',type)).toBe(true);
		expect(dictionary.getClassMembers(type).sort()).toEqual(['fifth','first','fourth','second','third'])
	})
})
