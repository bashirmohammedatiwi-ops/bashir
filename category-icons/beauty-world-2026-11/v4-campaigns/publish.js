// Beauty Spell v4: campaign-photo heroes (RYBELLA, GRIGI first), brand rooms, «براندات مميزة» spotlight wall.
const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';const UP='/tmp/bw4';
const W='0c6628d2-926e-45ef-8a76-1731a40a490f';
(async()=>{
 const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const tok=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});
 const H={Authorization:`Bearer ${tok}`,'X-SSR':'deema-web'};
 const call=async(m,p,b)=>{const r=await fetch(API+p,{method:m,headers:{...H,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(`${m} ${p} ${r.status} ${t.slice(0,300)}`);const j=JSON.parse(t);return j.data!==undefined?j.data:j;};
 const blocks=await prisma.homeBlock.findMany({where:{worldId:W}});
 const banners=await prisma.banner.findMany({where:{worldId:W}});
 const RB='/data/uploads/beauty-v4-rollback-2026-11-04.json';
 if(!fs.existsSync(RB))fs.writeFileSync(RB,JSON.stringify({blocks,banners}));
 // uploads
 const media={};
 for(const f of fs.readdirSync(UP).filter(f=>f.endsWith('.jpg'))){
  const k=f.replace('.jpg','');
  const ex=await prisma.media.findFirst({where:{originalName:`bw4-${f}`},select:{id:true}});
  if(ex){media[k]=ex.id;continue;}
  const fd=new FormData();fd.append('purpose','BANNER');fd.append('file',new Blob([fs.readFileSync(`${UP}/${f}`)],{type:'image/jpeg'}),`bw4-${f}`);
  const r=await fetch(API+'/media/upload',{method:'POST',headers:H,body:fd});const t=await r.text();if(!r.ok)throw new Error('upload '+f+t.slice(0,200));
  media[k]=(JSON.parse(t).data||JSON.parse(t)).id;
 }
 console.log('media',Object.keys(media).length);
 // 1 heroes: hide all current, add the 8 new in order
 for(const b of banners.filter(b=>b.isActive)) await call('PATCH',`/banners/${b.id}`,{title:b.title,isActive:false});
 const HERO=[['h1_rybella','ريبيلا — Nude, redefined','rybella'],['h2_grigi','كريجي — Black & Berry','grigi'],['h3_huda','هدى بيوتي — Beauty, by Huda','huda-beauty'],
  ['h4_mufe','ميك أب فور إيفر — Made to last','make-up-for-ever'],['h5_catrice','كاتريس — Coverage that lasts','catrice'],['h6_sheglam','شيغلام — Glam, together','sheglam'],
  ['h7_essence','إيسنس — Lashes that rule','essence'],['h8_nyx','نيكس — Melt into glow','nyx']];
 for(const [i,[img,title,slug]] of HERO.entries()){
  const ex=banners.find(b=>b.title===title);
  if(ex) await call('PATCH',`/banners/${ex.id}`,{title,imageId:media[img],position:i,isActive:true});
  else await call('POST','/banners',{title,imageId:media[img],linkType:'brand',linkValue:slug,worldId:W,position:i,isActive:true});
 }
 // 2 rooms: swap banner image inside existing brand groups
 const B=k=>blocks.find(x=>x.id.startsWith(k));
 const ROOMS={'9bd4e9cd':'r_rybella','26b2c8ba':'r_grigi','bed123ac':'r_huda','d686fe03':'r_sheglam','1f7edf96':'r_astra','aa2e74da':'r_maybelline','5ed21142':'r_nyx','ce951b11':'r_artdeco'};
 for(const [k,img] of Object.entries(ROOMS)){
  const b=B(k);const p=JSON.parse(JSON.stringify(b.payload));
  const c=p.children.find(c=>c.type==='CUSTOM_BANNER');c.payload.imageId=media[img];c.payload.bannerAspect=2.15;
  await call('PATCH',`/home-blocks/${b.id}`,{payload:p,isActive:true});
 }
 // 3 new rooms: Catrice, Essence
 const huda=B('bed123ac').payload;
 const mkRoom=async(title,en,img,slug,brandId,tint)=>{
  const ex=blocks.find(b=>b.type==='SECTION_GROUP'&&b.title===title&&b.isActive);
  const p=JSON.parse(JSON.stringify(huda));p.titleEn=en;p.backgroundColor=tint;
  p.children[0].payload={...p.children[0].payload,imageId:media[img],linkValue:slug};
  p.children[1].payload={...p.children[1].payload,brandId,titleEn:en};
  if(ex){await call('PATCH',`/home-blocks/${ex.id}`,{payload:p});return ex.id;}
  return (await call('POST','/home-blocks',{type:'SECTION_GROUP',worldId:W,pageKey:'HOME',title,payload:p,position:99,isActive:true})).id;
 };
 const catrice=await mkRoom('كاتريس','Catrice','r_catrice','catrice','0e997aba-07dd-4177-b5ca-3d7bb2481eb0','#F6ECE6');
 const essence=await mkRoom('إيسنس','Essence','r_essence','essence','9c5204f9-10be-484a-8e65-23b3ad53bb3c','#FBEAF1');
 // 4 spotlight wall
 const CARDS=[['c_rybella','rybella'],['c_grigi','grigi'],['c_huda','huda-beauty'],['c_mufe','make-up-for-ever'],['c_catrice','catrice'],['c_sheglam','sheglam'],
  ['c_essence','essence'],['c_nyx','nyx'],['c_maybelline','maybelline'],['c_astra','astra'],['c_artdeco','artdeco']];
 const wallP={titleEn:'Brand spotlight',subtitle:'أشهر الماركات العالمية بحملاتها الرسمية',subtitleEn:'The world\'s favourite beauty brands',display:'scroll',aspectRatio:'4:5',
  tilesPerView:1.6,gap:10,tileCornerRadius:18,showTitle:true,showViewAll:false,showShadow:false,overlayStyle:'none',borderStyle:'none',
  items:CARDS.map(([img,slug])=>({title:'',titleEn:'',subtitleEn:'',imageId:media[img],linkType:'brand',linkValue:slug}))};
 const exW=blocks.find(b=>b.type==='PHOTO_WALL'&&b.title==='براندات مميزة'&&b.isActive);
 const wall=exW?(await call('PATCH',`/home-blocks/${exW.id}`,{payload:wallP})).id||exW.id:(await call('POST','/home-blocks',{type:'PHOTO_WALL',worldId:W,pageKey:'HOME',title:'براندات مميزة',payload:wallP,position:99,isActive:true})).id;
 // 5 order: featured, RYBELLA, GRIGI, spotlight, flash, looks, ..., brand rooms (Huda, Catrice, Sheglam, Essence, Astra, MUFE, Maybelline, NYX, Artdeco), KOST, all brands
 const o=k=>B(k).id;
 const order=[o('73dedc60'),o('9bd4e9cd'),o('26b2c8ba'),wall,o('30db6b4e'),o('89b711c9'),o('135282e0'),o('60a2253e'),o('468a4954'),o('a70fd02f'),o('f52ab320'),o('00070af7'),
  o('bed123ac'),catrice,o('d686fe03'),essence,o('1f7edf96'),o('4deb3a52'),o('aa2e74da'),o('5ed21142'),o('ce951b11'),o('32141870'),o('87c31f33')];
 for(const [i,id] of order.entries()) await call('PATCH',`/home-blocks/${id}`,{position:i});
 console.log('done',{wall,catrice,essence,order:order.length});
 await prisma.$disconnect();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
