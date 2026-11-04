// Apply curated within-brand order: active products in the curated order, inactive ones after (keeping their relative order).
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web','Content-Type':'application/json'};
 const O=JSON.parse(fs.readFileSync('/tmp/ordup/order.json','utf8'));
 const RB='/data/uploads/brand-order-rollback-2026-11-04.json';
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify(await prisma.product.findMany({where:{brandId:{in:Object.keys(O)}},select:{id:true,brandId:true,position:true}})));
 let n=0,fail=0;
 for(const [bid,head] of Object.entries(O)){
  const all=await prisma.product.findMany({where:{brandId:bid},orderBy:[{position:'asc'},{createdAt:'asc'},{id:'asc'}],select:{id:true}});
  const hs=new Set(head);const ids=[...head,...all.map(x=>x.id).filter(id=>!hs.has(id))];
  const r=await fetch(API+'/products/reorder',{method:'POST',headers:H,body:JSON.stringify({brandId:bid,ids})});
  if(!r.ok){fail++;console.log('FAIL',bid,r.status,(await r.text()).slice(0,200));}else n++;
 }
 console.log('brands ok',n,'fail',fail);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
