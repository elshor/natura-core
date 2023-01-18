/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { calcTemplate } from './template.js';
import SuperType from './super-type.js';

export default class TemplateType extends SuperType{
	constructor(template,location,dictionary){
		super('template type',dictionary||(location? location.dictionary : null))
		this.template = template;
		this.location = location;
	}

	get type(){
		return this.location
			? calcTemplate(this.template,this.location.contextNoSearch,true) || 'cannot calculate type'
			: 'cannot calculate type';
	}
}
