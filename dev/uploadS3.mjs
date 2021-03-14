import axios from 'axios';
import qs from 'querystring';
import config from './credentials.js'
import fs from 'fs'

export async function uploadS3(bucket,id,content,contentType=guessContentType(id)){
	let tokenRes = '';

	try{
		tokenRes = await axios({
			method:'post',
			url:'https://iam.cloud.ibm.com/identity/token',
			headers:{
				'Content-Type':'application/x-www-form-urlencoded'
			},
			data: qs.stringify({
				apikey:config['data-apikey'],
				response_type:'cloud_iam',
				grant_type:'urn:ibm:params:oauth:grant-type:apikey'
			})
		});
	}catch(e){
		console.error('Got Exception getting access token',e);
		throw {
			error:'upload-object-access-token',
			e:errorData(e)
		}
	}
	try{
		const url = `https://${config['data-endpoint']}/${bucket}/${encodeURIComponent(id)}`;
		const res = await axios({
			method:'put',
			url,
			data:content,
			headers:{
				Authorization: 'Bearer ' + tokenRes.data.access_token,
				'Content-Type':contentType
			}
		});
		console.info('Uploaded',url);
		return true;
	}catch(e){
		console.error('Exception uploading object',e);
		throw {
			error:'upload-object'
		};
	}
}

function guessContentType(filename){
	const parsed = filename.match(/\.([a-z ]+)$/);
	if(!parsed){
		return 'text/plain'
	}
	switch(parsed[1]){
		case '.js':
			return 'text/javascript';
		case '.map':
		case '.json':
			return 'application/json'
		default:
			return 'application/octet-stream'
	}
}