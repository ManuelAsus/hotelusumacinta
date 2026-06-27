/*
 Script: fetch_and_write_index.js
 Usage: node scripts/fetch_and_write_index.js
 Requires: Place a Firebase service account JSON at the repo root named `serviceAccountKey.json`.
 What it does:
 - Uses Firebase Admin SDK to read document `pages/index` and images stored under `images/{imageId}/chunks/{chunkIndex}`
 - Reconstructs base64 images and replaces placeholders `FIREBASE_IMG::imageId` in the HTML
 - Writes the resulting HTML to `web/index.html` (overwrites)
*/

const fs = require('fs');
const path = require('path');

async function main(){
  const servicePath = path.resolve(__dirname, '..', 'serviceAccountKey.json');
  if(!fs.existsSync(servicePath)){
    console.error('serviceAccountKey.json not found at repo root. Place your Firebase service account JSON there.');
    process.exit(1);
  }

  const admin = require('firebase-admin');
  const serviceAccount = require(servicePath);
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
  const db = admin.firestore();

  const pageDoc = await db.collection('pages').doc('index').get();
  if(!pageDoc.exists){ console.error('pages/index document not found in Firestore'); process.exit(1); }

  let html = pageDoc.data().templateHtml;
  if(!html){ console.error('pages/index.templateHtml empty'); process.exit(1); }

  // find all placeholders
  const regex = /FIREBASE_IMG::([a-zA-Z0-9_\-]+)/g;
  const ids = new Set();
  let m;
  while((m=regex.exec(html)) !== null){ ids.add(m[1]); }

  for(const id of ids){
    const chunksSnap = await db.collection('images').doc(id).collection('chunks').orderBy('index').get();
    if(chunksSnap.empty){ console.warn('No chunks for image', id); continue; }
    // get header from images doc
    const meta = await db.collection('images').doc(id).get();
    const header = meta.exists && meta.data().header ? meta.data().header : 'data:image/jpeg;base64,';
    const parts = [];
    chunksSnap.forEach(doc => { parts.push(doc.data().data); });
    const base64 = parts.join('');
    const dataUrl = header + base64;
    // replace all occurrences
    html = html.split('FIREBASE_IMG::'+id).join(dataUrl);
  }

  const outPath = path.resolve(__dirname, '..', 'web', 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Wrote', outPath);
}

main().catch(err=>{ console.error(err); process.exit(1); });
