/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import pkg from './npkg-interact'
import base from '../packages/base'
import Dictionary from '../dictionary'
import {createLocation} from '../location'
import {readFileSync} from 'fs'
describe('location spec',()=>{
	const dictionary = new Dictionary();
	dictionary.setPackages([base,pkg]);
	dictionary.reload();
	it('test type of top item and action',()=>{
		const location = createLocation({$type:'interaction'},dictionary);
		expect(location.type.toString()).toBe('interaction');
		expect(location.expectedType.toString()).toBe('any');
		expect(location.spec.properties).not.toBeFalsy();
		expect(location.child('action').expectedType.toString()).toBe('action');
	})
	it('test array child type',()=>{
		const location = createLocation({$type:'notebook'},dictionary);
		expect(location.type.toString()).toBe('notebook');
		expect(location.child('interactions').child(-1).type.toString()).toBe('interaction');
		expect(location.child('interactions').child(-1).child('action').expectedType.toString()).toBe('action');
		expect(location.child('interactions').child(-1).child('action').type.toString()).toBe('action');
	})
	it('should use expected type defined in createLocation',()=>{
		const location = createLocation([],dictionary,'','interaction*');
		expect(location.expectedType.toString()).toBe('interaction*');
		expect(location.child('-1').expectedType.toString()).toBe('interaction');
	})
	it('should process notebook doc correctly',()=>{
		const notebook = JSON.parse(readFileSync(__dirname+'/docs/notebook.json'));
		expect(notebook.$type).toBe('notebook');
		
		const location = createLocation(notebook,dictionary);
		expect(location.type.toString()).toBe('notebook');
		
		const interactions = location.child('interactions');
		expect(interactions.type.toString()).toBe('interaction*');
		expect(interactions.expectedType.toString()).toBe('interaction*');
		
		const interaction = interactions.child('-1');
		expect(interaction.expectedType.toString()).toBe('interaction');
		expect(interaction.type.toString()).toBe('interaction');

		const action = interaction.child('action');
		expect(action.path).toBe('/interactions/-1/action');
		expect(action.expectedType.toString()).toBe('action');

		const action0 = interactions.child(0).child('action');
		expect(action0.path).toBe('/interactions/0/action');
		expect(action0.expectedType.toString()).toBe('action');
		expect(action0.type.toString()).toBe('show chart');
	})

})

