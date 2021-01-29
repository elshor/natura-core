import Cloudant from '@cloudant/cloudant';
import cred from './credentials.js'

const db = Cloudant(cred);

export default async function (doc){
	doc._id = 'public:' + doc.name;
	doc.$owner = 'eshor';
	
	//load existing published doc under this name if exists
	let existingPublishedDoc = null;
	try{
		existingPublishedDoc = await db.use('docs').get(doc._id);
		if(!existingPublishedDoc){
			delete doc._rev;
		}else if(existingPublishedDoc.$owner !== doc.$owner){
			throw {
				error:'unauthorized',
				message:'A document with this name already exists and owned by another user'
			};
		}else{
			doc._rev = existingPublishedDoc._rev;
		}
	}catch{
		delete doc._rev;
	}

	//store the document
	try{
		const res = await db.use('docs').insert(doc);
	}catch(e){
		throw {
			module:'publish-doc',
			error:'unknown',
			message:'There was a server error publishing the document'
		};
	}
}
