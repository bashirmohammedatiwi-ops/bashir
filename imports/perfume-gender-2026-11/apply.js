// Move perfumes to the correct gender subcategory (primary + many-to-many), keep their other tags; regroup brand order.
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';
const G={women:'1ba9f472-af81-4708-9304-07f3435b6b24',men:'8dca642a-1194-4101-b5cc-486ca1664e89',unisex:'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a'};
const GIDS=new Set(Object.values(G));
(async()=>{const fixes=JSON.parse(fs.readFileSync('/tmp/perf_fixes.json','utf8'));
 const ids=fixes.map(f=>f.id);
 const before=await prisma.product.findMany({where:{id:{in:ids}},select:{id:true,brandId:true,subcategoryId:true,nameAr:true,name:true,subcategories:{select:{id:true}}}});
 const RB='/data/uploads/perfume-gender-rollback-2026-11-04.json';
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify(before));
 const by=Object.fromEntries(before.map(p=>[p.id,p]));
 let n=0;const brands=new Set();
 for(const f of fixes){const p=by[f.id];if(!p)continue;const to=G[f.correct];
  const data={subcategories:{disconnect:p.subcategories.filter(c=>GIDS.has(c.id)&&c.id!==to).map(c=>({id:c.id})),connect:[{id:to}]}};
  if(!p.subcategoryId||GIDS.has(p.subcategoryId))data.subcategoryId=to;
  if(f.nameAr){data.nameAr=f.nameAr;data.name=f.nameAr;}
  await prisma.product.update({where:{id:f.id},data});n++;brands.add(p.brandId);}
 console.log('moved',n);
 // regroup affected brands: keep current order, but in-stock first then by gender block (first-appearance order)
 const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web','Content-Type':'application/json'};
 for(const b of brands){
  const all=await prisma.product.findMany({where:{brandId:b},orderBy:[{position:'asc'},{createdAt:'asc'},{id:'asc'}],select:{id:true,isActive:true,stock:true,subcategoryId:true,subcategories:{select:{id:true}}}});
  const g=(p)=>{const s=[p.subcategoryId,...p.subcategories.map(c=>c.id)].find(x=>GIDS.has(x));return s||'other';};
  const rank={};const act=all.filter(p=>p.isActive);act.forEach(p=>{const k=g(p);if(!(k in rank))rank[k]=Object.keys(rank).length;});
  const sorted=act.map((p,i)=>({p,i})).sort((x,y)=>((x.p.stock>0?0:1)-(y.p.stock>0?0:1))||(rank[g(x.p)]-rank[g(y.p)])||(x.i-y.i)).map(x=>x.p.id);
  const ids2=[...sorted,...all.filter(p=>!p.isActive).map(p=>p.id)];
  const r=await fetch(API+'/products/reorder',{method:'POST',headers:H,body:JSON.stringify({brandId:b,ids:ids2})});if(!r.ok)console.log('reorder fail',b,r.status);
 }
 console.log('brands regrouped',brands.size);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
