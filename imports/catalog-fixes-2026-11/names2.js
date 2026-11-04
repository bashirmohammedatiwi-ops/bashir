const fs=require('fs');const {PrismaClient}=require('@prisma/client');const prisma=new PrismaClient();
const W='1ba9f472-af81-4708-9304-07f3435b6b24',M='8dca642a-1194-4101-b5cc-486ca1664e89';
(async()=>{const N=JSON.parse(fs.readFileSync('/tmp/names2.json','utf8'));
 const ids=N.map(x=>x.id);
 fs.writeFileSync('/data/uploads/names-en2-rollback-2026-11-04.json',JSON.stringify(await prisma.product.findMany({where:{id:{in:ids}},select:{id:true,nameEn:true,subcategoryId:true,subcategories:{select:{id:true}}}})));
 let n=0;for(const x of N){await prisma.product.update({where:{id:x.id},data:{nameEn:x.nameEn.trim()}});n++;}
 const sed=await prisma.product.findFirst({where:{id:{startsWith:'1838de54'},isActive:true},include:{subcategories:{select:{id:true}}}});
 if(sed){await prisma.product.update({where:{id:sed.id},data:{subcategoryId:sed.subcategoryId===M?W:sed.subcategoryId,subcategories:{disconnect:[{id:M}],connect:[{id:W}]}}});console.log('sedbury',sed.nameEn);}
 console.log('names',n);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
