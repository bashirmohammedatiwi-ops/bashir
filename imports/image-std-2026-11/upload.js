// Upload standardised product images (std1-<oldMediaId>.jpg) and record old→new media ids. Idempotent.
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';const DIR='/tmp/stdout';
const MAP='/data/uploads/image-std-map-2026-11-04.json';
const sleep=(ms)=>new Promise((r)=>setTimeout(r,ms));
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 let tok,exp=0;const H=()=>{if(Date.now()>exp){tok=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});exp=Date.now()+50*60e3;}return {Authorization:`Bearer ${tok}`,'X-SSR':'deema-web'};};
 const ids=JSON.parse(fs.readFileSync(DIR+'/list.json','utf8'));
 const map=fs.existsSync(MAP)?JSON.parse(fs.readFileSync(MAP,'utf8')):{};
 let n=0;
 for(const old of ids){
  if(map[old])continue;
  const ex=await prisma.media.findFirst({where:{originalName:`std1-${old}.jpg`},select:{id:true}});
  if(ex){map[old]=ex.id;continue;}
  const fd=new FormData();fd.append('purpose','PRODUCT');
  fd.append('file',new Blob([fs.readFileSync(`${DIR}/${old}.jpg`)],{type:'image/jpeg'}),`std1-${old}.jpg`);
  let r,t;for(let k=0;k<3;k++){r=await fetch(API+'/media/upload',{method:'POST',headers:H(),body:fd});t=await r.text();if(r.ok)break;await sleep(3000);}
  if(!r.ok){console.log('FAIL',old,r.status,t.slice(0,150));continue;}
  map[old]=(JSON.parse(t).data||JSON.parse(t)).id;n++;
  if(n%50===0){fs.writeFileSync(MAP,JSON.stringify(map));
   // let the variant queue catch up before piling on more work
   for(let k=0;k<60;k++){const m=await prisma.media.findUnique({where:{id:map[old]},select:{variants:true}});if(m?.variants?.large)break;await sleep(2000);}
   console.log('uploaded',n,'mapped',Object.keys(map).length);}
 }
 fs.writeFileSync(MAP,JSON.stringify(map));console.log('done uploaded',n,'mapped',Object.keys(map).length,'of',ids.length);
 await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
