const fs=require('fs');const {PrismaClient}=require('@prisma/client');const prisma=new PrismaClient();
(async()=>{const ids=['f7e0dd50-b4b6-4fa9-8af8-110b5244a557','714eee10-9c10-4a90-b952-96ba3e155a89','ec89baf3-05c4-40c6-8fb9-fca1095c3c20'];
 fs.writeFileSync('/data/uploads/catalog-fixes2-rollback-2026-11-04.json',JSON.stringify({products:await prisma.product.findMany({where:{id:{in:ids}}}),shades:await prisma.productShade.findMany({where:{productId:{in:ids}}})}));
 const cc=await prisma.productShade.findFirst({where:{productId:ids[0],name:{contains:'كورال'}}});
 await prisma.productShade.update({where:{id:cc.id},data:{barcode:'6291106038231',stock:5}});
 for(const id of ids.slice(1)){await prisma.productShade.deleteMany({where:{productId:id}});await prisma.product.update({where:{id},data:{stock:0}});}
 console.log('ok',cc.name);await prisma.$disconnect();})().catch(e=>{console.error(e);process.exit(1)});
