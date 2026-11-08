// Pending barcode drafts (2026-11-08) → products. new: create via API (grouped shades → one product);
// shade: add shade to existing product; duplicate: relink/activate existing; marks drafts added. Rollback first.
const fs=require('fs');const crypto=require('crypto');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';const UP='/tmp/dr2';
const slugify=(s)=>String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
(async()=>{
 const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const tok=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'3h'});
 const H={Authorization:`Bearer ${tok}`,'X-SSR':'deema-web'};
 const call=async(m,p,b)=>{const r=await fetch(API+p,{method:m,headers:{...H,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(`${m} ${p} ${r.status} ${t.slice(0,400)}`);const j=JSON.parse(t);return j.data!==undefined?j.data:j;};
 const items=JSON.parse(fs.readFileSync(UP+'/plan.json','utf8'));const images=JSON.parse(fs.readFileSync(UP+'/images.json','utf8'));
 const RB='/data/uploads/drafts2-rollback-2026-11-08.json';
 const touched=items.filter(x=>x.existingProductId).map(x=>x.existingProductId);
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify({products:await prisma.product.findMany({where:{id:{in:touched}}}),shades:await prisma.productShade.findMany({where:{productId:{in:touched}}}),
   drafts:await prisma.barcodeDraft.findMany({where:{id:{in:items.map(x=>x.draftId)}}})}));
 // media
 const media={};
 for(const files of Object.values(images))for(const f of files){
  const ex=await prisma.media.findFirst({where:{originalName:`draft2-${f}`},select:{id:true}});
  if(ex){media[f]=ex.id;continue;}
  const fd=new FormData();fd.append('purpose','PRODUCT');fd.append('file',new Blob([fs.readFileSync(`${UP}/final/${f}`)],{type:'image/jpeg'}),`draft2-${f}`);
  const r=await fetch(API+'/media/upload',{method:'POST',headers:H,body:fd});const t=await r.text();if(!r.ok)throw new Error('upload '+f+t.slice(0,200));
  media[f]=(JSON.parse(t).data||JSON.parse(t)).id;
 }
 console.log('media',Object.keys(media).length);
 const imgs=(id)=>(images[id]||[]).map(f=>media[f]).filter(Boolean);
 // brands
 const brands=Object.fromEntries((await prisma.brand.findMany({select:{id:true,slug:true,name:true}})).map(b=>[b.slug,b.id]));
 const byName=Object.fromEntries((await prisma.brand.findMany({select:{id:true,name:true}})).map(b=>[b.name.toLowerCase(),b.id]));
 const brandId=async(x)=>{
  if(x.brandSlug)return brands[x.brandSlug];
  const nm=x.newBrand.name.trim();if(byName[nm.toLowerCase()])return byName[nm.toLowerCase()];
  const b=await call('POST','/brands',{name:nm,isActive:true});byName[nm.toLowerCase()]=b.id;console.log('brand+',nm);return b.id;
 };
 const snap=(bc)=>prisma.inventorySyncSnapshot.findUnique({where:{barcode:bc}});
 const done=(draftId,productId,shadeId)=>prisma.barcodeDraft.update({where:{id:draftId},data:{addedAt:new Date(),productId,shadeId:shadeId??null}});
 const uniqSlug=async(base)=>{let s=base,i=2;while(await prisma.product.findFirst({where:{slug:s},select:{id:true}}))s=`${base}-${i++}`;return s;};
 const catBody=(x)=>({categoryId:x.categoryId,subcategoryId:x.subcategoryId||undefined,subcategoryIds:x.subcategoryId?[x.subcategoryId]:[],
   ...(x.tertiaryCategoryId?{tertiaryCategoryId:x.tertiaryCategoryId,tertiaryCategoryIds:[x.tertiaryCategoryId]}:{})});
 const stats={created:0,grouped:0,shades:0,relinked:0,activated:0,skipped:[]};
 // 1 new singles + groups
 const groups={};for(const x of items.filter(x=>x.decision==='new'&&x.groupKey))(groups[x.groupKey]??=[]).push(x);
 for(const x of items.filter(x=>x.decision==='new')){
  if(x.groupKey&&groups[x.groupKey].length>1)continue;
  if(await prisma.product.findFirst({where:{barcode:x.barcode},select:{id:true}})){const p=await prisma.product.findFirst({where:{barcode:x.barcode}});await done(x.draftId,p.id);continue;}
  const s=await snap(x.barcode);if(!s){stats.skipped.push([x.draftId,'no pos']);continue;}
  const p=await call('POST','/products',{sku:x.barcode,slug:await uniqSlug(slugify(x.nameEn)),barcode:x.barcode,brandId:await brandId(x),...catBody(x),
    name:x.nameAr,nameAr:x.nameAr,nameEn:x.nameEn,descriptionAr:x.descriptionAr,descriptionEn:x.descriptionEn,
    price:s.price,originalPrice:s.originalPrice||s.price,discountPercent:s.discountPercent||0,stock:Math.max(0,s.stock||0),isActive:true,imageIds:imgs(x.draftId)});
  await done(x.draftId,p.id);stats.created++;
 }
 for(const [k,g] of Object.entries(groups)){
  if(g.length<2)continue;const x=g[0];
  const snaps=await Promise.all(g.map(y=>snap(y.barcode)));
  const shades=g.map((y,i)=>({name:y.shadeName||`#${i+1}`,colorHex:y.colorHex||null,barcode:y.barcode,imageId:imgs(y.draftId)[0],price:snaps[i]?.price??0,originalPrice:snaps[i]?.originalPrice??snaps[i]?.price??0,
    discountPercent:snaps[i]?.discountPercent??0,stock:Math.max(0,snaps[i]?.stock??0),position:i,isActive:true}));
  const base=x.nameEn.replace(/\s*[-–]?\s*(ivory|porcelain|shade.*)$/i,'');
  const p=await call('POST','/products',{sku:k,slug:await uniqSlug(slugify(k)),brandId:await brandId(x),...catBody(x),name:x.nameAr,nameAr:x.nameAr,nameEn:base,
    descriptionAr:x.descriptionAr,descriptionEn:x.descriptionEn,price:shades[0].price,originalPrice:shades[0].originalPrice,stock:0,isActive:true,imageIds:[shades[0].imageId].filter(Boolean),shades});
  const sh=await prisma.productShade.findMany({where:{productId:p.id}});
  for(const y of g){const s=sh.find(z=>z.barcode===y.barcode);await done(y.draftId,p.id,s?.id);}
  stats.grouped++;
 }
 // 2 shades on existing products
 for(const x of items.filter(x=>x.decision==='shade')){
  const s=await snap(x.barcode);if(!s){stats.skipped.push([x.draftId,'no pos']);continue;}
  let sh=await prisma.productShade.findFirst({where:{productId:x.existingProductId,barcode:x.barcode}});
  if(!sh){const n=await prisma.productShade.count({where:{productId:x.existingProductId}});
   sh=await prisma.productShade.create({data:{id:crypto.randomUUID(),productId:x.existingProductId,name:x.shadeName,colorHex:x.colorHex||null,barcode:x.barcode,imageId:imgs(x.draftId)[0]||null,
     price:s.price,originalPrice:s.originalPrice||s.price,discountPercent:s.discountPercent||0,stock:Math.max(0,s.stock||0),isActive:true,position:n}});}
  const all=await prisma.productShade.findMany({where:{productId:x.existingProductId,isActive:true}});
  const lead=[...all.filter(z=>z.stock>0)].sort((p,q)=>(p.price??1e12)-(q.price??1e12))[0]||all[0];
  await prisma.product.update({where:{id:x.existingProductId},data:{isActive:true,stock:all.reduce((t,z)=>t+z.stock,0),price:lead.price??0,originalPrice:lead.originalPrice??0}});
  await done(x.draftId,x.existingProductId,sh.id);stats.shades++;
 }
 // 3 duplicates: relink when the old barcode has no POS stock (or new has more), else just activate+link
 for(const x of items.filter(x=>x.decision==='duplicate')){
  const p=await prisma.product.findUnique({where:{id:x.existingProductId}});const sNew=await snap(x.barcode);const sOld=p.barcode?await snap(p.barcode):null;
  if(!sNew){stats.skipped.push([x.draftId,'no pos']);continue;}
  const taken=await prisma.product.findFirst({where:{barcode:x.barcode,NOT:{id:p.id}},select:{id:true}});
  if(!taken&&(!sOld||(sOld.stock||0)<=0||(sNew.stock||0)>(sOld.stock||0))){
   await prisma.product.update({where:{id:p.id},data:{barcode:x.barcode,isActive:(sNew.stock||0)>0||p.isActive,price:sNew.price,originalPrice:sNew.originalPrice||sNew.price,discountPercent:sNew.discountPercent||0,stock:Math.max(0,sNew.stock||0),isPromo:(sNew.discountPercent||0)>0}});
   if(!(await prisma.productImage.count({where:{productId:p.id}}))&&imgs(x.draftId).length)for(const [i,m] of imgs(x.draftId).entries())await prisma.productImage.create({data:{id:crypto.randomUUID(),productId:p.id,mediaId:m,position:i,isPrimary:i===0}});
   stats.relinked++;
  } else { await prisma.product.update({where:{id:p.id},data:{isActive:true}}); stats.activated++; }
  await done(x.draftId,p.id);
 }
 await call('PATCH',`/products/${touched[0]}`,{isActive:true});
 console.log(JSON.stringify(stats));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
