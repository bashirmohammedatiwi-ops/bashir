import json, os, sys, time
from multiprocessing import Pool
sys.path.insert(0, '/work')
from std import process, process_seg
items = json.load(open('/work/work_items.json'))
os.makedirs('/work/out', exist_ok=True)
def one(it):
    src = '/media/' + it['rel'] + '.webp'
    if not os.path.exists(src):
        src = '/media/' + it['rel'] + '.jpg'
    try:
        r = process(src, '/work/out/' + it['id'] + '.jpg', it['primary'])
        if r['action'] == 'skip' and r['reason'] == 'busy-background' and it['primary']:
            r = process_seg(src, '/work/out/' + it['id'] + '.jpg')
    except Exception as e:
        r = dict(action='error', reason=str(e)[:120])
    r['id'] = it['id']; r['primary'] = it['primary']
    return r
if __name__ == '__main__':
    t = time.time(); done = 0
    with Pool(int(os.environ.get('WORKERS', '2'))) as p, open('/work/results.jsonl', 'w') as f:
        for r in p.imap_unordered(one, items, chunksize=8):
            f.write(json.dumps(r) + '\n'); done += 1
            if done % 500 == 0:
                print(done, round(time.time() - t), flush=True)
    print('finished', done, round(time.time() - t))
