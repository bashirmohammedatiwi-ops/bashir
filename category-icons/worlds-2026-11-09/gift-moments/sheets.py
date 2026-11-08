import sys, os, glob
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE+'/../kit')
from kit import set_out, sheet
set_out(HERE+'/out')
n=lambda p: sorted(os.path.basename(f)[:-4] for f in glob.glob(f'{HERE}/out/{p}*.png'))
print(sheet(n('h'),'sheet_heroes')); print(sheet(n('r'),'sheet_rooms')); print(sheet(n('c'),'sheet_cards',w=540,cols=5))
print(sheet(n('t')+n('o')+n('b'),'sheet_tiles',w=420,cols=5)); print(sheet(n('s'),'sheet_strips',w=1075,cols=1))
