// Upload prepared images and attach them: shades get imageId in place, the product gets its primary image replaced.
const fs=require('fs');const crypto=require('crypto');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';const DIR='/tmp/shadefix';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web'};
 const prep=JSON.parse(fs.readFileSync(DIR+'/prep.json','utf8')).filter(r=>!r.error);
 const sh=prep.filter(r=>r.kind==='shade').map(r=>r.key),pr=prep.filter(r=>r.kind==='product').map(r=>r.key);
 const RB='/data/uploads/shade-images-rollback-2026-11-04.json';
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify({shades:await prisma.productShade.findMany({where:{id:{in:sh}},select:{id:true,imageId:true}}),images:await prisma.productImage.findMany({where:{productId:{in:pr}}})}));
 const ids=[];
 for(const r of prep){
  const name=`fix1-${r.key}.jpg`;
  let m=await prisma.media.findFirst({where:{originalName:name},select:{id:true}});
  if(!m){const fd=new FormData();fd.append('purpose','PRODUCT');fd.append('file',new Blob([fs.readFileSync(`${DIR}/${r.key}.jpg`)],{type:'image/jpeg'}),name);
   const x=await fetch(API+'/media/upload',{method:'POST',headers:H,body:fd});const tx=await x.text();if(!x.ok){console.log('FAIL',r.key,tx.slice(0,150));continue;}
   m={id:(JSON.parse(tx).data||JSON.parse(tx)).id};}
  r.media=m.id;ids.push(m.id);
 }
 // wait until display sizes exist
 for(let k=0;k<90;k++){const n=await prisma.$queryRawUnsafe(`select count(*)::int n from "Media" where id = any($1::text[]) and not variants ? 'large'`,ids);if(n[0].n===0)break;await sleep(5000);}
 let s=0,p=0;
 for(const r of prep){if(!r.media)continue;
  if(r.kind==='shade'){const n=await prisma.productShade.updateMany({where:{id:r.key},data:{imageId:r.media}});if(n.count)s++;else console.log('shade gone',r.key);}
  else{await prisma.$transaction(async(tx)=>{const cur=await tx.productImage.findMany({where:{productId:r.key},include:{media:{select:{storagePath:true}}}});
    for(const c of cur)if(c.media.storagePath==='placeholder')await tx.productImage.delete({where:{id:c.id}});
    await tx.productImage.updateMany({where:{productId:r.key},data:{isPrimary:false,position:{increment:1}}});
    await tx.productImage.create({data:{id:crypto.randomUUID(),productId:r.key,mediaId:r.media,position:0,isPrimary:true}});});p++;}}
 const pid=(await prisma.productShade.findFirst({where:{id:{in:sh}},select:{productId:true}})).productId;
 const f=await fetch(API+'/products/'+pid,{method:'PATCH',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({isActive:true})});
 console.log('shades',s,'products',p,'flush',f.status);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
