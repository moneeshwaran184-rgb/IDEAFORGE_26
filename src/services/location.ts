let lastRequest = 0;
export async function validateTamilNadu(lat:number,lng:number): Promise<string> {
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<8||lat>13.6||lng<76.2||lng>80.4) throw new Error('Choose a location in Tamil Nadu.');
 const delay=Math.max(0,1100-(Date.now()-lastRequest));
 lastRequest=Date.now()+delay;
 await new Promise(resolve=>setTimeout(resolve,delay));
 const response=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat='+lat+'&lon='+lng);
 if(!response.ok) throw new Error('Location verification is unavailable. Please try again shortly.');
 const place=await response.json();
 if(place.address?.country_code!=='in'||place.address?.state!=='Tamil Nadu') throw new Error('Reports and suggestions must be located in Tamil Nadu.');
 return place.address.state_district || place.address.county || place.address.city || 'Tamil Nadu';
}

export async function searchLocations(query:string):Promise<{lat:string;lon:string;display_name:string}[]> {
 const delay=Math.max(0,1100-(Date.now()-lastRequest));lastRequest=Date.now()+delay;
 await new Promise(resolve=>setTimeout(resolve,delay));
 const response=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=10&accept-language=en&q='+encodeURIComponent(query+', Tamil Nadu'));
 if(!response.ok)throw new Error('Location search unavailable');
 const results=await response.json();
 return results.filter((r:{address?:{state?:string}})=>r.address?.state==='Tamil Nadu');
}
