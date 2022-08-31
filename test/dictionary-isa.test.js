/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import pkg from './docs/ga4'
import base from '../packages/base'
import Dictionary from '../dictionary'

describe('dictionary isa',()=>{
	const dictionary = new Dictionary();
	dictionary.setPackages([base,pkg]);
	dictionary.reload();
	it('should show type isa type',()=>{
		expect(dictionary.isa('transaction','transaction')).toBe(true);
	})
	it('should show type isa category',()=>{
		expect(dictionary.isa('transaction','type that has date')).toBe(true);
	})
	it('should show specialized generic type as generic',()=>{
		expect(dictionary.isa('specifier<transaction>','specifier')).toBe(true);
	})
	it('should show generic of a subtype isa generic of supertype',()=>{
		expect(dictionary.isa('specifier<type that has date>','specifier<transaction>')).toBe(true);
	})
})
