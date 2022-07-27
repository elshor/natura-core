/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import SuperType from './super-type.js'

export default class BaseType extends SuperType{
	constructor(type,dictionary){
		super('base type',dictionary)
		this.type = type || 'any';
	}
}
