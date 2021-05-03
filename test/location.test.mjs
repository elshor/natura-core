/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {createLocation} from '../location.js';
import Dictionary from '../dictionary.js'

const pkg = {
	entities:{
		$type:'entity definition group',
		members:[{
			name:'whatever',
			key:'a'
		}],
	}
}

const dictionary = new Dictionary();
dictionary.load(pkg);

const data = {
	a:1,
	b:2
}

describe('location',()=>{
	it('get simple location - no path',()=>{
		const location = createLocation(data);
		expect(location.value.a).toEqual(1);
	})
	it('get path value',()=>{
		const location  = createLocation(data,null,'/a');
		expect(location.value).toBe(1);
	})
	it('get path with default key',()=>{
		const array = [
			{$key:'a',value:'one'},
			{$key:'b',value:'two'}
		]
		expect(createLocation(array,dictionary,'/#a/value').value).toBe('one');
	})
	it('set deep value',()=>{
		const array = [
			{$key:'a',value:'one'},
			{$key:'b',value:'two'}
		]		
		const location = createLocation(array,dictionary,'/#c/value/#d/whatever/1');
		location.set('funny');
		expect(array[2].$key).toEqual('c');
		expect(array[2].value[0].$key).toBe('d');
		expect(array[2].value[0].whatever[1]).toBe('funny');
		expect(createLocation(array,dictionary,'/#c/value/#d/whatever/1').value).toBe('funny');

	})
})