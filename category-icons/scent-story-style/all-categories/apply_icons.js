const fs=require('fs');const jwt=require('jsonwebtoken');const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();const API='http://127.0.0.1:3000/api/v1';const UP='/tmp/catup';
(async()=>{const a=await prisma.user.findFirst({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}});
 const t=jwt.sign({sub:a.id,role:a.role},process.env.JWT_ACCESS_SECRET||'access',{expiresIn:'1h'});const H={Authorization:`Bearer ${t}`,'X-SSR':'deema-web'};
 const MAP=JSON.parse(fs.readFileSync(UP+'/map.json','utf8'));
 const old=await prisma.category.findMany({where:{id:{in:MAP.map(m=>m[1])}},select:{id:true,name:true,imageId:true}});
 fs.writeFileSync('/data/uploads/cat-icons-rollback-2026-11-03.json',JSON.stringify(old));console.log('rollback saved',old.length);
 let ok=0;
 for(const [n,id,kind] of MAP){const fd=new FormData();fd.append('purpose','CATEGORY');
  fd.append('file',new Blob([fs.readFileSync(`${UP}/${n}.png`)],{type:'image/png'}),`category-${n}.png`);
  const r=await fetch(API+'/media/upload',{method:'POST',headers:H,body:fd});const j=await r.json();const mid=(j.data||j).id;
  if(!r.ok||!mid){console.log('upload fail',n,r.status,JSON.stringify(j).slice(0,200));continue;}
  const p=await fetch(`${API}/${kind}/${id}`,{method:'PATCH',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({imageId:mid})});
  if(p.ok) ok++; else console.log('patch fail',n,kind,p.status,(await p.text()).slice(0,200));}
 console.log('applied',ok,'/',MAP.length);await prisma.$disconnect();})();
