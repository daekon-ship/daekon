# menu.json -> menu.js (window.LIMIT_MENU), hogy a bemutató build és szerver nélkül is fusson
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((root / 'data/menu.json').read_text(encoding='utf-8'))
(root / 'data/menu.js').write_text('/* generálva: _forras/menu_js_gen.py — a forrás a data/menu.json */\nwindow.LIMIT_MENU = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
print('ok', len(data['pizzas']), 'pizza,', len(data['drinks']), 'ital')
