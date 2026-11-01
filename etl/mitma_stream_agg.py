# Aggregates a streamed MITMA day: trips into Madrid, Barcelona, Zaragoza, Valencia, Sevilla, Malaga districts, total, from other districts, by hour.
import sys,collections,json
day=sys.argv[1];tot=collections.Counter();ext=collections.Counter();hr=collections.defaultdict(lambda:[0.0]*24)
hdr=None
CITIES=('28079','08019','50297','46250','41091','29067')
for line in sys.stdin:
    if hdr is None: hdr=line.rstrip('\n').split('|');io=hdr.index('origen');idd=hdr.index('destino');iv=hdr.index('viajes');ip=hdr.index('periodo');continue
    c=line.split('|');d=c[idd]
    if not d.startswith(CITIES):continue
    v=float(c[iv]);tot[d]+=v;hr[d][int(c[ip])]+=v
    if c[io]!=d: ext[d]+=v
json.dump({"day":day,"tot":tot,"ext":ext,"hr":hr},open(f"agg_{day}.json","w"))
print(day,len(tot),sum(tot.values()))
