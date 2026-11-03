import json, time, subprocess, os
rows=[l.rstrip('\n').split('|') for l in open('pending.txt')]
out=json.load(open('upc.json')) if os.path.exists('upc.json') else {}
for r in rows:
    bc=r[2]
    if bc in out or not bc.isdigit(): continue
    for attempt in range(3):
        p=subprocess.run(['curl','-s','-D','-',f'https://api.upcitemdb.com/prod/trial/lookup?upc={bc}'],capture_output=True,text=True)
        head,_,body=p.stdout.replace('\r\n','\n').partition('\n\n')
        try: d=json.loads(body)
        except Exception: d={'code':'PARSE','body':body[:200]}
        if d.get('code')=='TOO_FAST': time.sleep(30); continue
        break
    out[bc]=d; json.dump(out,open('upc.json','w'))
    rem=[l for l in head.split('\n') if 'remaining' in l.lower()]
    print(bc, d.get('code'), d.get('total'), rem, flush=True)
    time.sleep(11)
