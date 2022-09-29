/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {parsePattern} from '../pattern.js'

describe('pattern parsing',()=>{
	it('should parse simple pattern and derive properties',()=>{
		const parsed = parsePattern('between <<date>> and <<date>>');
		expect(parsed.fields[0].type).toBe('date');
		expect(parsed.fields[1].type).toBe('date');
		expect(parsed.fields[0].name).toBe('date');
		expect(parsed.fields[1].name).toBe('date1');
	})

	it('should parse fillins with type and name',()=>{
		const parsed = parsePattern('between <<date:start date>> and <<date:end date>>');
		expect(parsed.fields[0].type).toBe('date');
		expect(parsed.fields[1].type).toBe('date');
		expect(parsed.fields[0].name).toBe('start date');
		expect(parsed.fields[1].name).toBe('end date');
	})
})
