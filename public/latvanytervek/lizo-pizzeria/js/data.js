/* Lizó Pizzéria és Ételbár – étlapadatok
 * Forrás: lizopizza.hu/etlap és falatozz.hu (Budapest XVIII. / Lizo Pizzéria és Ételbár), ellenőrizve: 2026-11-12.
 * A forrásokat és az eltéréseket lásd: _kutatas/etlap-adatok.md és _kutatas/egyeztetesi-lista.md
 * Árak forintban. Pizza: [32 cm, 50 cm]. Feláras extrák a forrásokban nem szerepelnek, ezért itt sincsenek.
 */
(function () {
  const AMM = 'Ammerlander klasszikus sajt';
  const GY = 'gyros hús (csirkecombfiléből)';
  const base = { p: 'paradicsomos alap', t: 'tejfölös alap', b: 'BBQ alap', z: 'tzatziki alap' };
  const pz = (id, name, b, toppings, p32, p50, extra = {}) => ({
    id, cat: 'pizza', name, base: b,
    items: [base[b], ...toppings, AMM],
    locked: [base[b]],
    sizes: [{ k: '32', label: '32 cm', price: p32 }, { k: '50', label: '50 cm', price: p50 }],
    ...extra
  });

  const categories = [
    { id: 'pizza', name: 'Pizza', short: 'Pizza', note: '32 és 50 cm' },
    { id: 'edes', name: 'Édes pizza', short: 'Édes pizza', note: '32 cm' },
    { id: 'hamburger', name: 'Hamburger', short: 'Hamburger' },
    { id: 'smash', name: 'Smash burger', short: 'Smash' },
    { id: 'gyros', name: 'Gyros', short: 'Gyros' },
    { id: 'menu', name: 'Street food menü', short: 'Menük', note: 'hasábburgonyával, üdítővel' },
    { id: 'palacsinta', name: 'Palacsinta', short: 'Palacsinta', note: '3 db' },
    { id: 'desszert', name: 'Desszert', short: 'Desszert' },
    { id: 'udito', name: 'Üdítő', short: 'Üdítő' }
  ];

  const products = [
    pz('alap', 'Alap pizza', 'p', [], 3850, 5575),
    pz('bbq', 'BBQ pizza', 'b', [GY, 'bacon', 'lilahagyma', 'paradicsom'], 4812, 7295),
    pz('betyar', 'Betyár pizza', 'p', ['paprikás szalámi', 'hegyes erős paprika', 'feta sajt'], 4812, 7295, { hot: true }),
    pz('bolognai', 'Bolognai pizza', 'p', ['bolognai ragu'], 4400, 6435),
    pz('calzone', 'Calzone pizza', 't', ['sonka', GY], 4675, 7005),
    pz('chicken', 'Chicken pizza', 't', [GY, 'sonka', 'paradicsom', 'fokhagymás olaj'], 4812, 7295),
    pz('don-diego', 'Don Diego pizza', 'p', [GY, 'bacon', 'lilahagyma', 'hegyes erős paprika', 'paradicsom', 'füstölt sajt'], 5087, 7865, { hot: true }),
    pz('fonix', 'Főnix pizza', 't', ['tarja', 'lilahagyma', 'jalapeño', 'tükörtojás (3 db)', 'pirospaprika'], 4812, 7295, { hot: true }),
    pz('gazdaboltos', 'Gazdaboltos Kedvence pizza', 'p', ['sonka', 'szalámi', 'tarja', 'gomba', 'dupla sajt'], 4950, 7580),
    pz('gyrosos', 'Gyrosos pizza', 'z', [GY, 'bacon', 'lilahagyma', 'paradicsom'], 4812, 7295),
    pz('hawaii', 'Hawaii pizza', 'p', ['sonka', 'ananász', 'kukorica'], 4537, 6720),
    pz('hun', 'Hun pizza', 't', ['bacon', 'lilahagyma', 'füstölt sajt'], 4537, 6720),
    pz('hustorony', 'Hústorony pizza', 'p', ['sonka', 'kolbász', 'bacon', 'tarja', 'szalámi'], 4950, 7580),
    pz('kazinczy', 'Kazinczy pizza', 't', ['sonka', 'bacon', 'csípős pepperoni', 'paprika', 'lilahagyma'], 4812, 7295, { hot: true }),
    pz('kolbaszos', 'Kolbászos pizza', 'p', ['kolbász'], 4400, 6435),
    pz('kukoricas', 'Kukoricás pizza', 'p', ['kukorica'], 4125, 6005),
    pz('lizo-kerek', 'Lizo kerék pizza', 'p', ['szalámi', 'kolbász', 'rukkola', 'koktélparadicsom', 'mozzarella sajt', 'parmezán sajt'], 4537, 8435, { house: true }),
    pz('magyaros', 'Magyaros pizza', 'p', ['kolbász', 'bacon', 'lilahagyma', 'hegyes erős paprika', 'paradicsom'], 4812, 7295, { hot: true }),
    pz('margareta', 'Margaréta pizza', 'p', ['paradicsomkarika', 'fokhagymás olaj'], 4400, 6435),
    pz('negyevszak', 'Négyévszak pizza', 'p', ['brokkoli', 'kukorica', 'gomba', 'ananász', 'hegyes erős paprika', 'paradicsom'], 4537, 6720, { hot: true }),
    pz('negyiz', 'Négyíz pizza', 'p', ['sonka', 'szalámi', 'gomba', 'ananász'], 4812, 7295),
    pz('negysajtos', 'Négysajtos pizza', 'p', ['mozzarella sajt', 'füstölt sajt', 'feta sajt'], 4537, 6720),
    pz('quasimodo', 'Quasimodo pizza', 'p', ['szalámi', 'kukorica'], 4400, 6435),
    pz('romai', 'Római pizza', 'p', ['sonka', 'gomba'], 4400, 6435),
    pz('sonkas', 'Sonkás pizza', 'p', ['sonka'], 4400, 6435),
    pz('szalamis', 'Szalámis pizza', 'p', ['szalámi'], 4400, 6435),
    pz('tenger', 'Tenger gyümölcse pizza', 'p', ['tenger gyümölcsei', 'citromkarika'], 4950, 7560),
    pz('tonhalas', 'Tonhalas pizza', 'p', ['tonhal', 'lilahagyma', 'kapribogyó', 'citrom'], 4950, 7580),
    pz('zoltsy', 'Zoltsy pizza', 'p', ['sonka', 'kukorica'], 4400, 6435),

    { id: 'kolyok', cat: 'edes', name: 'Kölyök pizza', items: ['nutella', 'banán', 'cukorszórás'], locked: [], sizes: [{ k: '32', label: '32 cm', price: 3850 }] },

    { id: 'csirkeburger', cat: 'hamburger', name: 'Csirkeburger', price: 3400, burger: true, items: ['buci', 'csirkehúspogácsa', 'saláta', 'paradicsom', 'kígyóuborka', 'lilahagyma', 'cheddar sajt', 'házi hamburgerszósz'], locked: ['buci', 'csirkehúspogácsa'] },
    { id: 'marhaburger', cat: 'hamburger', name: 'Marhaburger', price: 3900, burger: true, items: ['buci', 'marhahúspogácsa', 'saláta', 'paradicsom', 'kígyóuborka', 'lilahagyma', 'cheddar sajt', 'házi hamburgerszósz'], locked: ['buci', 'marhahúspogácsa'] },
    { id: 'oriasdupla', cat: 'hamburger', name: 'Óriás dupla burger', price: 5000, burger: true, items: ['buci', 'dupla marhahúspogácsa', 'bacon', 'saláta', 'paradicsom', 'kígyóuborka', 'tükörtojás', 'cheddar sajt', 'trappista sajt', 'házi hamburgerszósz'], locked: ['buci', 'dupla marhahúspogácsa'] },
    { id: 'retro', cat: 'hamburger', name: 'Retro burger', price: 2900, burger: true, items: ['buci', 'húspogácsa', 'csalamádé', 'Retro burgerszósz'], locked: ['buci', 'húspogácsa'], hint: 'A húspogácsa választható – írd a megjegyzésbe, melyiket kéred.' },

    { id: 'duplasmash', cat: 'smash', name: 'Dupla smash burger', price: 4700, burger: true, items: ['buci', 'dupla marhahúspogácsa', 'káposztasaláta', 'lilahagyma', 'jalapeño', 'cheddar sajt', 'házi hamburgerszósz'], locked: ['buci', 'dupla marhahúspogácsa'], hot: true },
    { id: 'smash', cat: 'smash', name: 'Smash burger', price: 4200, burger: true, items: ['buci', 'marhahúspogácsa', 'káposztasaláta', 'lilahagyma', 'jalapeño', 'cheddar sajt', 'házi hamburgerszósz'], locked: ['buci', 'marhahúspogácsa'], hot: true },

    { id: 'gyrospita', cat: 'gyros', name: 'Gyros pitában', price: 3000, items: ['pita', GY, 'káposzta', 'paradicsom', 'kígyóuborka', 'lilahagyma', 'tzatziki', 'csípős szósz'], locked: ['pita', GY] },
    { id: 'gyrostortilla', cat: 'gyros', name: 'Gyros tortillában', price: 3500, items: ['tortilla', GY, 'káposzta', 'paradicsom', 'kígyóuborka', 'lilahagyma', 'tzatziki', 'csípős szósz'], locked: ['tortilla', GY] },
    { id: 'kisgyrostal', cat: 'gyros', name: 'Kis gyros tál', price: 3800, items: [GY, 'tzatziki', 'saláta', 'paradicsom', 'kígyóuborka', 'lilahagyma', 'csípős szósz', 'választható köret'], locked: [GY, 'választható köret'], hint: 'A köretet írd a megjegyzésbe.' },
    { id: 'nagygyrostal', cat: 'gyros', name: 'Nagy gyros tál', price: 4700, items: [GY, 'tzatziki', 'saláta', 'paradicsom', 'kígyóuborka', 'lilahagyma', 'csípős szósz', 'választható köret'], locked: [GY, 'választható köret'], hint: 'A köretet írd a megjegyzésbe.' },
    { id: 'lizosmashtal', cat: 'gyros', name: 'Lizo smash tál', price: 4500, house: true, items: ['hasábburgonya', 'bacon', 'friss saláta', 'újhagyma', 'négysajtos szósz'], locked: ['hasábburgonya'] },

    { id: 'm-csirke', cat: 'menu', name: 'Csirkeburger menü', price: 4300, menu: true, items: ['csirkeburger', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-marha', cat: 'menu', name: 'Marhaburger menü', price: 4900, menu: true, items: ['marhaburger', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-oriasdupla', cat: 'menu', name: 'Óriás dupla burger menü', price: 5800, menu: true, items: ['óriás dupla burger', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-retro', cat: 'menu', name: 'Retro burger menü', price: 3900, menu: true, items: ['retro burger', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-smash', cat: 'menu', name: 'Smash burger menü', price: 5200, menu: true, items: ['smash burger', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-duplasmash', cat: 'menu', name: 'Dupla smash burger menü', price: 6500, menu: true, items: ['dupla smash burger', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-gyrospita', cat: 'menu', name: 'Gyros pita menü', price: 4000, menu: true, items: ['gyros pita', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-gyrostortilla', cat: 'menu', name: 'Gyros tortilla menü', price: 4300, menu: true, items: ['gyros tortilla', 'hasábburgonya', 'választható üdítő'] },
    { id: 'm-kisgyrostal', cat: 'menu', name: 'Kis gyros tál menü', price: 4300, menu: true, items: ['kis gyros tál', 'választható köret', 'választható üdítő'], hint: 'A köretet írd a megjegyzésbe.' },
    { id: 'm-nagygyrostal', cat: 'menu', name: 'Nagy gyros tál menü', price: 5200, menu: true, items: ['nagy gyros tál', 'választható köret', 'választható üdítő'], hint: 'A köretet írd a megjegyzésbe.' },

    { id: 'pal-barack', cat: 'palacsinta', name: 'Baracklekváros palacsinta', price: 1590, items: ['3 db'] },
    { id: 'pal-eper', cat: 'palacsinta', name: 'Eperlekváros palacsinta', price: 1590, items: ['3 db'] },
    { id: 'pal-nutella', cat: 'palacsinta', name: 'Eredeti nutellás palacsinta', price: 1590, items: ['3 db'] },
    { id: 'pal-turos', cat: 'palacsinta', name: 'Túrós palacsinta', price: 1590, items: ['3 db'] },

    { id: 'tiramisu', cat: 'desszert', name: 'Tiramisu', price: 1890, items: [] },
    { id: 'profiterol', cat: 'desszert', name: 'Vaníliás profiterol', price: 1399, items: ['csokiöntettel'] },

    { id: 'cola05', cat: 'udito', name: 'Coca-Cola 0,5 l', price: 850, variants: ['Coca-Cola', 'Coca-Cola Zero', 'Coca-Cola Cherry'] },
    { id: 'cola033', cat: 'udito', name: 'Coca-Cola 0,33 l', price: 550, variants: ['Coca-Cola', 'Coca-Cola Zero', 'Coca-Cola Cherry'] },
    { id: 'fanta05', cat: 'udito', name: 'Fanta narancs 0,5 l', price: 850 },
    { id: 'fanta033', cat: 'udito', name: 'Fanta narancs 0,33 l', price: 550 },
    { id: 'sprite033', cat: 'udito', name: 'Sprite 0,33 l', price: 550 },
    { id: 'viz05', cat: 'udito', name: 'Szentkirályi ásványvíz 0,5 l', price: 450, variants: ['szénsavas', 'szénsavmentes'] }
  ];

  products.forEach(p => { p.items = p.items || []; p.locked = p.locked || []; });

  // A menükben választható üdítő: a forrás csak annyit ír, hogy „választható üdítő”.
  // A lista az üdítőkategória fajtáiból áll; a kiszerelés ügyféllel egyeztetendő (lásd egyeztetési lista).
  const menuDrinks = ['Coca-Cola', 'Coca-Cola Zero', 'Coca-Cola Cherry', 'Fanta narancs', 'Sprite', 'Szentkirályi ásványvíz'];

  const restaurant = {
    name: 'Lizó Pizzéria és Ételbár',
    address: '1183 Budapest, Balassa Bálint utca 2–10.',
    phone: '+36 30 388 7099',
    phoneHref: 'tel:+36303887099',
    mapsHref: 'https://www.google.com/maps/place/1183+Budapest,+Balassa+B%C3%A1lint+utca+2-10./',
    // 0 = vasárnap
    hours: { 0: ['11:00', '21:40'], 1: ['11:00', '21:40'], 2: ['11:00', '21:40'], 3: ['11:00', '21:40'], 4: ['11:00', '21:40'], 5: ['10:00', '23:00'], 6: ['10:00', '23:00'] },
    minOrder: 3000,
    deliveryTime: '60–90 perc',
    areas: ['Budapest XVIII. kerület', 'Gyál', 'Vecsés']
  };

  window.LIZO = { categories, products, menuDrinks, restaurant, verified: '2026-11-12' };
})();
