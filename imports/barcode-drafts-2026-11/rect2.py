import sys, glob, os, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session
from rectify import quad_from_mask
sess=new_session('isnet-general-use')
for f in sorted(glob.glob('sp/*.webp')):
    n=os.path.basename(f)[:-5]
    im=Image.open(f).convert('RGB')
    mask=np.array(remove(im,session=sess,only_mask=True,post_process_mask=True))
    q=quad_from_mask(mask)
    w=int(max(np.linalg.norm(q[0]-q[1]),np.linalg.norm(q[3]-q[2]))); h=int(max(np.linalg.norm(q[0]-q[3]),np.linalg.norm(q[1]-q[2])))
    M=cv2.getPerspectiveTransform(q,np.array([[0,0],[w,0],[w,h],[0,h]],dtype=np.float32))
    out=cv2.warpPerspective(np.array(im),M,(w,h),flags=cv2.INTER_CUBIC)
    Image.fromarray(out).save(f'rect/{n}.png'); print(n,w,h,flush=True)
