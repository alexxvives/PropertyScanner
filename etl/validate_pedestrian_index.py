import csv, io, math, collections, json, osmium, sys
rows=collections.defaultdict(lambda: collections.defaultdict(int)); loc={}
for r in csv.DictReader(io.open('data/raw/r29/p23.csv',encoding='utf-8-sig'),delimiter=';'):
    k=list(r.keys())
    sid=r[k[2]]; day=r[k[0]].split(' ')[0]
    try: v=int(r[k[3]] or 0)
    except: continue
    rows[sid][day]+=v
    if sid not in loc:
        try: loc[sid]=(float(r[k[-2]].replace(',','.')),float(r[k[-1]].replace(',','.')),r[k[6]]+' '+r[k[7]])
        except: pass
st={s:sum(d.values())/len(d) for s,d in rows.items() if len(d)>60}
print(len(st),'stations')
B=(40.30,-3.85,40.56,-3.55)
shops=[];ped=[];stops=[]
class H(osmium.SimpleHandler):
    def add(self,lat,lon,tags):
        if not(B[0]<lat<B[2] and B[1]<lon<B[3]): return
        if 'shop' in tags or tags.get('amenity') in ('restaurant','cafe','bar','fast_food','pharmacy','bank'): shops.append((lat,lon))
        if tags.get('highway') in ('bus_stop',) or tags.get('railway') in ('subway_entrance','station','tram_stop') or tags.get('public_transport')=='station': stops.append((lat,lon))
    def node(self,n):
        if n.location.valid(): self.add(n.location.lat,n.location.lon,dict(n.tags))
    def way(self,w):
        t=dict(w.tags); hw=t.get('highway')
        try: pts=[(n.lat,n.lon) for n in w.nodes]
        except Exception: return
        if not pts: return
        if hw in ('pedestrian','living_street') or (hw=='footway' and t.get('footway') not in ('crossing','sidewalk')):
            for i in range(len(pts)-1):
                a,b=pts[i],pts[i+1]; L=math.hypot((a[0]-b[0])*111000,(a[1]-b[1])*85000); n=max(1,int(L/10))
                for j in range(n): ped.append((a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n))
        elif 'shop' in t or t.get('amenity') in ('restaurant','cafe','bar','fast_food'):
            self.add(pts[0][0],pts[0][1],t)
H().apply_file('data/raw/r19/madrid.osm.pbf',locations=True)
print(len(shops),len(ped),len(stops))
def cnt(P,lat,lon,r):
    return sum(1 for a,b in P if abs(a-lat)<r/111000 and abs(b-lon)<r/85000 and math.hypot((a-lat)*111000,(b-lon)*85000)<r)
def rank(x):
    o=sorted(range(len(x)),key=lambda i:x[i]); r=[0]*len(x); i=0
    while i<len(o):
        j=i
        while j+1<len(o) and x[o[j+1]]==x[o[i]]: j+=1
        for k in range(i,j+1): r[o[k]]=(i+j)/2
        i=j+1
    return r
def sp(x,y):
    rx,ry=rank(x),rank(y); mx=sum(rx)/len(rx); my=sum(ry)/len(ry)
    return sum((a-mx)*(b-my) for a,b in zip(rx,ry))/math.sqrt(sum((a-mx)**2 for a in rx)*sum((b-my)**2 for b in ry))
ids=[s for s in st if s in loc]; y=[st[s] for s in ids]
feat={}
for r in (150,300):
    feat[f'shops{r}']=[cnt(shops,*loc[s][:2],r) for s in ids]
    feat[f'ped{r}']=[cnt(ped,*loc[s][:2],r)*10 for s in ids]
    feat[f'stops{r}']=[cnt(stops,*loc[s][:2],r) for s in ids]
def z(v):
    v=[math.log1p(a) for a in v]; m=sum(v)/len(v); s=math.sqrt(sum((a-m)**2 for a in v)/len(v)) or 1; return [(a-m)/s for a in v]
for r in (150,300):
    feat[f'index{r}']=[a+b+c for a,b,c in zip(z(feat[f'shops{r}']),z(feat[f'ped{r}']),z(feat[f'stops{r}']))]
res={k:round(sp(v,y),3) for k,v in feat.items()}
print(json.dumps(res,indent=0))
for s,v in sorted(zip(ids,y),key=lambda t:-t[1]): print(s,int(v),loc[s][2][:40],feat['shops300'][ids.index(s)],feat['ped300'][ids.index(s)],feat['stops300'][ids.index(s)])
