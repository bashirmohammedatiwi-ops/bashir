// Deactivate products/shades with clearly wrong prices (0, or far off the line's real price).
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';
const PIDS=['55a58d62-bfa5-4949-bfeb-f5c4b7b39ffa','5df4258e-51e3-4a04-9255-72033220faa0','e3ccdd3f-6e97-45fd-abd3-d66c31421d41',
 'febc9ae2-a7e5-4a2d-ba74-c241c246c7ef','f63d5705-cccb-4e89-9fca-7528cd31d9a8','2d6bbb27-af94-4304-9760-3f52d4270e43','5da3e4bd-e902-43f9-b75c-69ee0ea2aacf','603443b9-72a8-48ea-aeed-f78a37b29ac3'];
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web','Content-Type':'application/json'};
 const shades=await prisma.productShade.findMany({where:{isActive:true,price:{lte:0},product:{isActive:true}},select:{id:true,productId:true,name:true,price:true}});
 fs.writeFileSync('/data/uploads/price-anomaly-rollback-2026-11-04.json',JSON.stringify({products:await prisma.product.findMany({where:{id:{in:[...PIDS,...new Set(shades.map(s=>s.productId))]}},select:{id:true,isActive:true,price:true,originalPrice:true}}),shades}));
 await prisma.productShade.updateMany({where:{id:{in:shades.map(s=>s.id)}},data:{isActive:false}});
 // products whose shown price came from a 0-priced shade: take the cheapest live shade
 for(const pid of new Set(shades.map(s=>s.productId))){
  const p=await prisma.product.findUnique({where:{id:pid},select:{price:true}});
  const live=await prisma.productShade.findMany({where:{productId:pid,isActive:true,price:{gt:0}},orderBy:{price:'asc'}});
  if(p.price<=0&&live.length)await prisma.product.update({where:{id:pid},data:{price:live[0].price,originalPrice:live[0].originalPrice??live[0].price}});
 }
 console.log('shades off',shades.length);
 for(const id of PIDS){const r=await fetch(API+'/products/'+id,{method:'PATCH',headers:H,body:JSON.stringify({isActive:false})});console.log(id.slice(0,8),r.status);}
 await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
