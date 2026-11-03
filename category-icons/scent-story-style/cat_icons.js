const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';
const MAP=[['i_oud','0bb891c1-2aa0-4e4a-ace8-f07f6b53f241','subcategories'],['i_musk','642aa63c-b29b-4431-95d3-2534d7df0c4f','subcategories'],['i_mini','59c4dabd-4e87-46e8-a6ce-e5e51a7e901b','subcategories'],['i_kids','2f0bc477-cc55-443a-809c-f5384cc6314a','subcategories'],['i_perfume','975e0e23-edd2-4181-ad6d-ecade6452b95','categories']];
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web'};
const old=await prisma.category.findMany({where:{id:{in:MAP.map(m=>m[1])}},select:{id:true,imageId:true}});fs.writeFileSync('/tmp/cat_icons_rollback.json',JSON.stringify(old));
for(const [n,id,kind] of MAP){const fd=new FormData();fd.append('purpose','CATEGORY');fd.append('file',new Blob([fs.readFileSync(`/tmp/ss_upload2/${n}.png`)],{type:'image/png'}),`scent-story-${n}.png`);
 const r=await fetch(API+'/media/upload',{method:'POST',headers:H,body:fd});const j=await r.json();const mid=(j.data||j).id;
 const p=await fetch(`${API}/${kind}/${id}`,{method:'PATCH',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({imageId:mid})});console.log(n,r.status,p.status);}
await prisma.$disconnect();})();
