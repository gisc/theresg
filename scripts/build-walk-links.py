#!/usr/bin/env python3
"""Precompute pedestrian walking distances between bus stops, MRT stations and
listed places, from OpenStreetMap footpaths and roads (BBBike Singapore extract).
Output: public/walk-links.json. Requires: pip install osmium scipy numpy.
Usage: python3 scripts/build-walk-links.py /path/to/Singapore.osm.pbf
OSM data (c) OpenStreetMap contributors, ODbL."""
import json, math, sys, pickle, os
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra, connected_components
from scipy.spatial import cKDTree
import osmium

PBF = sys.argv[1]
PUB = os.path.join(os.path.dirname(__file__), '..', 'public')
WALK_OK = {'footway','path','pedestrian','steps','residential','service','living_street','unclassified','tertiary','tertiary_link','secondary','secondary_link','primary','primary_link','road','track','corridor','cycleway','trunk','trunk_link'}
OPEN = ('yes','designated','permissive')

class H(osmium.SimpleHandler):
    def __init__(s):
        super().__init__(); s.edges = []
    def way(s, w):
        t = w.tags; hw = t.get('highway')
        if hw not in WALK_OK: return
        if t.get('foot') == 'no': return
        if t.get('access') in ('private','no') and t.get('foot') not in OPEN: return
        if hw in ('trunk','trunk_link') and t.get('foot') not in OPEN: return
        if hw == 'cycleway' and t.get('foot') not in OPEN: return
        pts = [(n.ref, n.lat, n.lon) for n in w.nodes]
        for a, b in zip(pts, pts[1:]): s.edges.append((a, b))

def hv(a, b, c, d):
    p = math.pi / 180
    x = math.sin((c-a)*p/2)**2 + math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*6371000*math.asin(math.sqrt(x))

h = H(); h.apply_file(PBF, locations=True)
ids = {}; coords = []; src = []; dst = []; wt = []
def idx(r, la, lo):
    if r not in ids: ids[r] = len(coords); coords.append((la, lo))
    return ids[r]
for a, b in h.edges:
    i = idx(*a); j = idx(*b); d = hv(a[1], a[2], b[1], b[2])
    src += [i, j]; dst += [j, i]; wt += [d, d]
coords = np.array(coords); n = len(coords)
G = csr_matrix((wt, (src, dst)), shape=(n, n))
ncomp, labels = connected_components(G, directed=False)
big = np.bincount(labels).argmax()
tree = cKDTree(coords * np.array([111320, 111320 * math.cos(math.radians(1.35))]))
SC = np.array([111320, 111320 * math.cos(math.radians(1.35))])

# Points
pts = []  # (id, kind, lat, lon)
for f in json.load(open(f'{PUB}/bus-stops.json'))['features']:
    p = f['properties']; pts.append((f"b:{p['code']}", 'stop', f['geometry']['coordinates'][1], f['geometry']['coordinates'][0]))
seen = set()
for line in json.load(open(f'{PUB}/mrt-lines.json'))['lines']:
    for s in line['stations']:
        if s['name'] in seen or 'lat' not in s: continue
        seen.add(s['name']); pts.append((f"m:{s['name']}", 'station', s['lat'], s['lon']))
for fn, prefix in (('hawker-centres', 'h'), ('attractions', 'a'), ('explore-places', 'p')):
    for it in json.load(open(f'{PUB}/{fn}.json'))['items']:
        if isinstance(it.get('lat'), (int, float)) and isinstance(it.get('lon'), (int, float)) and not it.get('closed'):
            pts.append((f"{prefix}:{it['name']}", 'place', it['lat'], it['lon']))
P = np.array([[p[2], p[3]] for p in pts])
dd, nn = tree.query(P * SC)
snapped = [(int(nn[i]) if dd[i] <= 120 and labels[nn[i]] == big else -1) for i in range(len(pts))]
snapd = [float(dd[i]) for i in range(len(pts))]
print('points', len(pts), 'unsnapped', sum(1 for s in snapped if s < 0))

# Limits by kind pair (network metres incl. snap distance)
LIM = {('stop','stop'): 300, ('stop','station'): 500, ('place','stop'): 500, ('place','station'): 900}
MAXLIM = 900
kinds = [p[1] for p in pts]
gridpts = [i for i, s in enumerate(snapped) if s >= 0]
pt_tree = cKDTree(P[gridpts] * SC)
links = {}  # i -> {j: m}
def lim(a, b):
    k = (a, b) if (a, b) in LIM else (b, a)
    return LIM.get(k)
B = 25
for start in range(0, len(gridpts), B):
    batch = gridpts[start:start+B]
    D = dijkstra(G, directed=False, indices=[snapped[i] for i in batch], limit=MAXLIM)
    for r, i in enumerate(batch):
        near = pt_tree.query_ball_point(P[i] * SC, MAXLIM)
        for q in near:
            j = gridpts[q]
            if j == i: continue
            L = lim(kinds[i], kinds[j])
            if L is None: continue
            d = D[r, snapped[j]]
            if not math.isfinite(d): continue
            d += snapd[i] + snapd[j]
            if d <= L:
                links.setdefault(i, {})[j] = round(d)
                links.setdefault(j, {})[i] = round(d)
out = {'source': 'OpenStreetMap contributors (ODbL), BBBike Singapore extract ' + os.path.basename(PBF), 'built': os.environ.get('WALK_BUILT', ''), 'ids': [p[0] for p in pts], 'unsnapped': [p[0] for p, s in zip(pts, snapped) if s < 0], 'links': {str(i): [x for kv in sorted(v.items()) for x in kv] for i, v in links.items()}}
json.dump(out, open(f'{PUB}/walk-links.json', 'w'), separators=(',', ':'))
print('linked points', len(links), 'bytes', os.path.getsize(f'{PUB}/walk-links.json'))
