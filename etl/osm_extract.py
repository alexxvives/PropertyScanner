import osmium, json, sys
BOX={'mad':(-3.95,40.30,-3.50,40.60),'bcn':(1.98,41.30,2.25,41.48)}
out=[]
def kind(t):
    a=t.get('amenity')
    if a in('parking','parking_entrance'):
        if t.get('access') in ('private','customers','no'): return None
        if t.get('parking') in ('street_side','lane','on_street'): return None
        return 'park'
    if a=='loading_dock' or t.get('parking')=='loading' or 'loading' in (t.get('parking:condition') or '') or t.get('amenity')=='loading_zone': return 'load'
    if a in ('school','kindergarten','college','university'): return 'school'
    if 'office' in t or t.get('building')=='office': return 'office'
    return None
class H(osmium.SimpleHandler):
    def __init__(s,box): super().__init__(); s.b=box
    def add(s,k,lon,lat,t):
        b=s.b
        if b[0]<=lon<=b[2] and b[1]<=lat<=b[3]:
            cap=t.get('capacity'); 
            try: cap=int(cap)
            except: cap=None
            out.append([k,round(lon,5),round(lat,5),cap])
    def node(s,n):
        k=kind(n.tags)
        if k and n.location.valid(): s.add(k,n.location.lon,n.location.lat,n.tags)
    def way(s,w):
        k=kind(w.tags)
        if not k: return
        try:
            xs=[(nd.lon,nd.lat) for nd in w.nodes if nd.location.valid()]
        except Exception: return
        if xs: s.add(k,sum(x for x,_ in xs)/len(xs),sum(y for _,y in xs)/len(xs),w.tags)
for city,f in (('mad','madrid'),('bcn','cataluna')):
    H(BOX[city]).apply_file(f'/workspace/PropertyScanner/data/raw/r19/{f}.osm.pbf',locations=True,idx='flex_mem')
import collections;print(collections.Counter(o[0] for o in out))
json.dump(out,open('/workspace/PropertyScanner/data/raw/r19/osm_pts.json','w'))
