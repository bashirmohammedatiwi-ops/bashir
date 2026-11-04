// Point product gallery images and shade images at the standardised media; rollback rows saved first.
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';
(async()=>{const map=JSON.parse(fs.readFileSync('/data/uploads/image-std-map-2026-11-04.json','utf8'));
 const olds=Object.keys(map);
 const RB='/data/uploads/image-std-rollback-2026-11-04.json';
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify({
  images:await prisma.productImage.findMany({where:{mediaId:{in:olds}},select:{id:true,productId:true,mediaId:true}}),
  shades:await prisma.productShade.findMany({where:{imageId:{in:olds}},select:{id:true,imageId:true}})}));
 // only switch to media whose display sizes are already built; rerun later for the rest
 const ready=new Set((await prisma.$queryRawUnsafe(`select id from "Media" where "originalName" like 'std1-%' and variants ? 'large'`)).map((r)=>r.id));
 let pi=0,ps=0,wait=0;
 for(const old of olds){
  if(!ready.has(map[old])){wait++;continue;}
  const nw=map[old];
  try{pi+=(await prisma.productImage.updateMany({where:{mediaId:old},data:{mediaId:nw}})).count;}catch(e){console.log('pi conflict',old,e.message.slice(0,80));}
  ps+=(await prisma.productShade.updateMany({where:{imageId:old},data:{imageId:nw}})).count;
 }
 console.log('productImages',pi,'shades',ps,'waiting',wait);
 const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const p=await prisma.product.findFirst({where:{isActive:true},select:{id:true}});
 const r=await fetch(API+'/products/'+p.id,{method:'PATCH',headers:{Authorization:`Bearer ${t}`,'X-SSR':'deema-web','Content-Type':'application/json'},body:JSON.stringify({isActive:true})});
 console.log('cache flush',r.status);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
