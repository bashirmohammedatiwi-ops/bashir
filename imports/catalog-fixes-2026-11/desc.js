const fs=require('fs');const {PrismaClient}=require('@prisma/client');const prisma=new PrismaClient();
(async()=>{const D=JSON.parse(fs.readFileSync('/tmp/desc_all.json','utf8'));
 fs.writeFileSync('/data/uploads/descriptions-rollback-2026-11-04.json',JSON.stringify(await prisma.product.findMany({where:{id:{in:D.map(x=>x.id)}},select:{id:true,descriptionAr:true,descriptionEn:true}})));
 let n=0;for(const x of D){const p=await prisma.product.findUnique({where:{id:x.id},select:{descriptionAr:true}});
  if(p&&!(p.descriptionAr||'').trim()){await prisma.product.update({where:{id:x.id},data:{descriptionAr:x.descriptionAr.trim(),descriptionEn:x.descriptionEn.trim()}});n++;}}
 console.log('descriptions',n);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
