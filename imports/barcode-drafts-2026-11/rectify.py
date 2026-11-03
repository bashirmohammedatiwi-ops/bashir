import cv2, numpy as np, glob, os, sys
from PIL import Image
def order(pts):
    pts=np.array(pts,dtype=np.float32); s=pts.sum(1); d=np.diff(pts,axis=1).ravel()
    return np.array([pts[np.argmin(s)],pts[np.argmin(d)],pts[np.argmax(s)],pts[np.argmax(d)]],dtype=np.float32)
def quad_from_mask(a):
    m=(a>128).astype(np.uint8)*255
    k=max(5,int(min(m.shape)*0.04))
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_RECT,(k,k)))
    cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    c=max(cs,key=cv2.contourArea); hull=cv2.convexHull(c)
    peri=cv2.arcLength(hull,True)
    for eps in np.linspace(0.01,0.08,15):
        ap=cv2.approxPolyDP(hull,eps*peri,True)
        if len(ap)==4: return order(ap.reshape(4,2))
    return order(cv2.boxPoints(cv2.minAreaRect(c)))
def rectify(src,dst,quad=None):
    im=np.array(Image.open(src).convert('RGBA'))
    q=quad if quad is not None else quad_from_mask(im[:,:,3])
    w=int(max(np.linalg.norm(q[0]-q[1]),np.linalg.norm(q[3]-q[2]))); h=int(max(np.linalg.norm(q[0]-q[3]),np.linalg.norm(q[1]-q[2])))
    M=cv2.getPerspectiveTransform(q,np.array([[0,0],[w,0],[w,h],[0,h]],dtype=np.float32))
    rgb=cv2.warpPerspective(im[:,:,:3],M,(w,h),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
    Image.fromarray(rgb).save(dst)
if __name__=='__main__':
    for f in sorted(glob.glob('sp_cut/*.png')):
        n=os.path.basename(f)[:-4]
        try: rectify(f,f'rect/{n}.png')
        except Exception as e: print(n,e)
