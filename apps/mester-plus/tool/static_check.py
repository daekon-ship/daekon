#!/usr/bin/env python3
"""Mester+ statikus ellenőrző (Flutter SDK nélküli környezethez).
Zárójel-egyensúly, relatív/package importok feloldása, YAML szintaxis,
és osztály/függvény hivatkozások durva kereszt-ellenőrzése."""
import os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = 'mester_plus'
errors = []

def strip(src):
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if src.startswith('//', i):
            j = src.find('\n', i); i = n if j < 0 else j; continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c in '\'"':
            raw = i > 0 and src[i-1] == 'r'
            q3 = src[i:i+3] in ("'''", '"""')
            q = src[i:i+3] if q3 else c
            j = i + len(q)
            depth = 0
            while j < n:
                if not raw and src[j] == '\\': j += 2; continue
                if not raw and src.startswith('${', j):
                    # interpoláció: zárójelek egyensúlyáig ugrunk
                    k, d = j + 2, 1
                    while k < n and d:
                        if src[k] == '{': d += 1
                        elif src[k] == '}': d -= 1
                        k += 1
                    j = k; continue
                if src.startswith(q, j): j += len(q); break
                j += 1
            out.append('""'); i = j; continue
        out.append(c); i += 1
    return ''.join(out)

dart_files = glob.glob(os.path.join(ROOT, 'lib/**/*.dart'), recursive=True) + \
             glob.glob(os.path.join(ROOT, 'test/**/*.dart'), recursive=True) + \
             glob.glob(os.path.join(ROOT, 'tool/*.dart'))
declared = set()
sources = {}
for f in dart_files:
    if f.endswith('.g.dart'): continue
    s = open(f, encoding='utf-8').read()
    sources[f] = s
    code = strip(s)
    # zárójel egyensúly
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for idx, ch in enumerate(code):
        if ch in '([{': stack.append((ch, idx))
        elif ch in ')]}':
            if not stack or stack[-1][0] != pairs[ch]:
                line = code[:idx].count('\n') + 1
                errors.append(f'{os.path.relpath(f, ROOT)}:{line}: nem illeszkedő "{ch}"'); break
            stack.pop()
    else:
        if stack:
            line = code[:stack[-1][1]].count('\n') + 1
            errors.append(f'{os.path.relpath(f, ROOT)}:{line}: lezáratlan "{stack[-1][0]}"')
    for m in re.finditer(r'\b(?:class|enum|mixin|extension|typedef)\s+([A-Za-z_]\w*)', code):
        declared.add(m.group(1))
    for m in re.finditer(r'^(?:final|const|late final)?\s*[\w<>?, ]*?\b([a-zA-Z_]\w*)\s*(?:=|\()', code, re.M):
        declared.add(m.group(1))
    # importok
    for m in re.finditer(r"^import\s+'([^']+)'", s, re.M):
        uri = m.group(1)
        if uri.startswith('package:'):
            if uri.startswith(f'package:{PKG}/'):
                target = os.path.join(ROOT, 'lib', uri[len(f'package:{PKG}/'):])
                if not os.path.exists(target): errors.append(f'{os.path.relpath(f, ROOT)}: hiányzó import {uri}')
            continue
        if uri.startswith('dart:'): continue
        target = os.path.normpath(os.path.join(os.path.dirname(f), uri))
        if not os.path.exists(target): errors.append(f'{os.path.relpath(f, ROOT)}: hiányzó import {uri}')
    for m in re.finditer(r"^part\s+'([^']+)'", s, re.M):
        if not m.group(1).endswith('.g.dart'):
            target = os.path.normpath(os.path.join(os.path.dirname(f), m.group(1)))
            if not os.path.exists(target): errors.append(f'{os.path.relpath(f, ROOT)}: hiányzó part {m.group(1)}')

# Drift által generált nevek (a .g.dart itt nem létezik)
declared |= {'_$AppDatabase', 'Customer', 'Project', 'SurveyArea', 'PriceItem', 'QuoteLine', 'CompanyProfile',
             'CustomersCompanion', 'ProjectsCompanion', 'SurveyAreasCompanion', 'PriceItemsCompanion',
             'QuoteLinesCompanion', 'CompanyProfilesCompanion', '$ProjectsTable'}
# Saját típusnevek hivatkozásai: csak a Mp*/projektspecifikus prefixeket nézzük,
# a Flutter/Dart könyvtári neveket nem tudjuk SDK nélkül feloldani.
own = re.compile(r'\b(Mp[A-Z]\w*|Fmt|Routes|QuoteCalculator|CalcLine|QuoteTotals|LineTotals|AreaMeasurements|'
                 r'ProjectWithCustomer|\w+Repository|\w+Provider|\w+Screen|VatRates|ProjectStatus|AdjustmentType|'
                 r'WorkUnit|TradeCategory|StatusChip|Pill|MoneyText|SectionLabel|KeyValueRow|EmptyState|AsyncView|'
                 r'PageHeader|CustomerAvatar|ProjectCard|ProjectNotFound|DashboardStats)\b')
flutter_known = {'ProviderScope', 'StreamProvider', 'ConsumerStatefulWidget', 'StatefulWidget', 'StatelessWidget'}
for f, s in sources.items():
    code = strip(s)
    for m in own.finditer(code):
        name = m.group(1)
        if name in declared or name in flutter_known: continue
        if name.endswith('Provider') and name[0].isupper(): continue  # pl. StateProvider
        line = code[:m.start()].count('\n') + 1
        errors.append(f'{os.path.relpath(f, ROOT)}:{line}: ismeretlen név "{name}"')

# YAML
try:
    import yaml
    for y in ['pubspec.yaml', 'analysis_options.yaml', 'build.yaml']:
        yaml.safe_load(open(os.path.join(ROOT, y), encoding='utf-8'))
    pub = yaml.safe_load(open(os.path.join(ROOT, 'pubspec.yaml'), encoding='utf-8'))
    for fam in pub['flutter']['fonts']:
        for fnt in fam['fonts']:
            if not os.path.exists(os.path.join(ROOT, fnt['asset'])):
                errors.append(f'pubspec: hiányzó font {fnt["asset"]}')
except ImportError:
    print('(PyYAML nincs telepítve — YAML ellenőrzés kihagyva)')

seen = set(); uniq = [e for e in errors if not (e in seen or seen.add(e))]
for e in uniq: print('HIBA', e)
print(f'{len(sources)} Dart fájl ellenőrizve, {len(uniq)} hiba.')
sys.exit(1 if uniq else 0)
