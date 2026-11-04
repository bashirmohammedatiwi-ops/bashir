// Deterministic catalogue fixes (2026-11-04): stock/shade mismatches, missing subcategories, missing Arabic names,
// expired/ending flash sales, inactive products inside home blocks. Rollback saved first.
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';
const C={perf:'975e0e23-edd2-4181-ad6d-ecade6452b95',women:'1ba9f472-af81-4708-9304-07f3435b6b24',men:'8dca642a-1194-4101-b5cc-486ca1664e89',unisex:'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a',niche:'92a95f2e-d855-4943-9875-b85e684f746a',
 eyes:'be0ba95f-62a6-4245-8012-5f6943ea5cab',eyeliner:'c8866117-67e0-4509-a887-60100775524b',brow:'92ebe64a-9091-4460-9f12-68ecbdf4e1e9',browPencil:'b1db1ac0-66ff-4912-8072-0c07e3fffda3',hl:'774d62c3-8119-4c0c-983b-2513fc46df24'};
const SUBS={ // productId: [subcategoryId, [m2m subs], tertiary|null, categoryId?]
 '225bb2cb-5e17-4098-b2c7-9668e948d1ee':[C.niche,[C.niche,C.unisex],null],
 '1b45773b-4b70-4066-8499-8deaa5343402':[C.niche,[C.niche,C.unisex],null],
 'f33d3766-6c33-44ea-b93b-18602391ec36':[C.men,[C.men],null,C.perf],
 'ad10fd3d-90f9-497a-a46d-5ca8580d8324':[C.women,[C.women],null],
 'ddb10204-32fd-43e5-b02d-c8c2a8d5fd5a':[C.women,[C.women],null],
 'f74ed6fa-261a-412d-8f56-64dcb85ef8d1':[C.women,[C.women],null],
 '7bd138a0-8960-4f93-bd1b-bf6305a537d7':[C.men,[C.men],null],
 'eb859c73-26cc-4496-b011-49253ae45733':[C.eyes,[C.eyes],C.eyeliner],
 '200b3de4-bcec-4812-a7f5-6913c06033db':[C.eyes,[C.eyes],C.eyeliner],
 'f1c77d6a-3b05-407a-a3a2-d928289e5af5':[C.brow,[C.brow],C.browPencil],
 '7378d964-9680-4c9f-8998-da400a0748a4':[C.hl,[C.hl],null]};
const AR={
 'be5dcb27-829e-4218-bcff-79f44b8d4923':'لوريال بروفشنال سير إكسبيرت - شامبو Vitamino Color Spectrum البنفسجي 300 مل',
 'bd22779b-c322-4880-8746-c7d1551433e0':'لوريال بروفشنال سير إكسبيرت - ماسك Vitamino Color للشعر المصبوغ 500 مل',
 '94669f36-38b2-48d2-bbb0-81ce31c47e11':'لوريال بروفشنال سير إكسبيرت - ماسك Pro Longer للشعر الطويل 500 مل',
 'c1a60838-3522-4321-9c55-70863ee99097':'لوريال بروفشنال سير إكسبيرت - ماسك Curl Expression للشعر المجعد 500 مل',
 '2e4aa5f1-8ee8-4a23-bf70-33d9d43a44ea':'لوريال بروفشنال سير إكسبيرت - ماسك Inforcer ضد تقصف الشعر 250 مل',
 'ac5b1ba3-a2c0-4559-9e2e-bd94722b835a':'لوريال بروفشنال سير إكسبيرت - شامبو Vitamino Color للشعر المصبوغ 500 مل'};
// single "size" shades without barcode/stock on perfumes sold as one item: drop them so the product's own POS stock applies
const DROP_SHADES_OF=['Dior Jadore Parfum d%',"Dior J'adore Intense for women%",'Dior Forever and Ever For Women%',"Dior J'Adore Infinissime For Women%",'Loewe Loewe 7 Women%'];
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web','Content-Type':'application/json'};
 const call=async(m,p,b)=>{const r=await fetch(API+p,{method:m,headers:H,body:b?JSON.stringify(b):undefined});const x=await r.text();if(!r.ok)throw new Error(`${m} ${p} ${r.status} ${x.slice(0,300)}`);return x;};
 // targets for the shade fix
 const dropP=[];
 for(const pat of DROP_SHADES_OF){const r=await prisma.$queryRawUnsafe(`select id from "Product" where "isActive" and "nameEn" like $1`,pat);dropP.push(...r.map(x=>x.id));}
 const ar=await prisma.$queryRawUnsafe(`select id from "Product" where "isActive" and ("nameAr" like 'مونتال عطر فيلفيت فانتازي%' or "nameAr" like 'زيرجوف او دو بارفان لوا%')`);dropP.push(...ar.map(x=>x.id));
 const homme=(await prisma.$queryRawUnsafe(`select id from "Product" where "isActive" and "nameEn" like 'Dior Homme by Christian Dior for Men%'`)).map(x=>x.id);
 const recount=(await prisma.$queryRawUnsafe(`select id from "Product" where "isActive" and ("nameEn" like 'Catrice Liquid Camouflage High Coverage Conce%' or "nameEn" like 'Huda Beauty Power Bullet Matte Lipstick%3g')`)).map(x=>x.id);
 const touched=[...dropP,...homme,...recount,...Object.keys(SUBS),...Object.keys(AR)];
 const RB='/data/uploads/catalog-fixes-rollback-2026-11-04.json';
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify({
  products:await prisma.product.findMany({where:{id:{in:touched}},include:{subcategories:{select:{id:true}},tertiaryCategories:{select:{id:true}}}}),
  shades:await prisma.productShade.findMany({where:{productId:{in:[...dropP,...homme]}}}),
  homeBlocks:await prisma.homeBlock.findMany({where:{isActive:true}})}));
 console.log('drop shades on',dropP.length,'homme',homme.length,'recount',recount.length);
 // 1. stock
 for(const id of dropP){await prisma.productShade.deleteMany({where:{productId:id}});}
 for(const id of homme){await prisma.productShade.deleteMany({where:{productId:id}});await prisma.product.update({where:{id},data:{stock:0}});}
 for(const id of recount){const s=await prisma.productShade.aggregate({where:{productId:id,isActive:true},_sum:{stock:true}});await prisma.product.update({where:{id},data:{stock:s._sum.stock??0}});}
 // 2. subcategories
 for(const [id,[sub,m2m,ter,cat]] of Object.entries(SUBS)){
  const data={subcategoryId:sub,subcategories:{set:m2m.map(x=>({id:x}))}};
  if(cat)data.categoryId=cat;
  if(ter)Object.assign(data,{tertiaryCategoryId:ter,tertiaryCategories:{set:[{id:ter}]}});
  await prisma.product.update({where:{id},data});}
 // 3. Arabic names
 for(const [id,n] of Object.entries(AR))await prisma.product.update({where:{id},data:{nameAr:n,name:n}});
 console.log('subs',Object.keys(SUBS).length,'ar names',Object.keys(AR).length);
 // 4. home blocks: expired main flash sale off, world flash sales extended, inactive products removed from lists
 const inactive=new Set((await prisma.product.findMany({where:{isActive:false},select:{id:true}})).map(x=>x.id));
 const strip=(v)=>Array.isArray(v)?v.filter(x=>!(typeof x==='string'&&inactive.has(x))).map(strip):(v&&typeof v==='object')?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,strip(x)])):v;
 const blocks=await prisma.homeBlock.findMany({where:{isActive:true}});
 let nb=0;
 for(const b of blocks){
  if(b.id==='2a28b634-9602-46c1-a97f-f2cc7c555795'){await call('PATCH',`/home-blocks/${b.id}`,{isActive:false});nb++;continue;}
  let p=strip(b.payload);
  if(['adc2613f-d657-42f5-adb7-8224237b104e','30db6b4e-f57f-4fc5-9b18-0dd59a297b35'].includes(b.id))p={...p,endsAt:'2026-11-30T21:00:00.000Z'};
  if(JSON.stringify(p)!==JSON.stringify(b.payload)){await call('PATCH',`/home-blocks/${b.id}`,{payload:p});nb++;}
 }
 console.log('home blocks updated',nb);
 await call('PATCH',`/products/${Object.keys(SUBS)[0]}`,{isActive:true});
 console.log('done');await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
