/* =========================================================
   MultiCont Center Kft. — TARTALOM (CMS-adatszerkezet, 14. kör)
   Minden, ami változik: cikkek, határidők, idővonal, dokumentumok,
   partnerek, ajánlatok. Élesben ugyanez a szerkezet jön adatbázisból,
   a kezelőfelületen (admin-*.html) szerkesztve.

   Közzétételi folyamat (cikk):
     piszkozat → előnézet → közzétéve   (forrás nélkül nem tehető közzé)
   Szabály: csak forrással igazolt adat kerülhet ide.
   minta: true = csak a megjelenést mutatja, nem valódi adat.
   ========================================================= */
window.MC = {

  ellenorizve: '2026-10-14',

  /* Tudástár-témák (a sorrend a menüben is ez) */
  temak: ['SZJA', 'ÁFA', 'KATA', 'Átalányadózás', 'TAO', 'KIVA', 'Bérszámfejtés', 'Járulékok',
          'NAV tájékoztatók', 'Vállalkozásindítás', 'Éves adózási kötelezettségek'],

  /* ---------- Cikkek ----------
     datum: közzététel · frissitve: utolsó ellenőrzés · hataly: melyik időszakra vonatkozik
     statusz: 'kozzeteve' | 'piszkozat' · tervezet: true = még nem elfogadott szabály */
  cikkek: [
    {
      id: 'uj-kata-2027-tervezet', datum: '2026-10-13', frissitve: '2026-10-21', statusz: 'kozzeteve',
      temak: ['KATA', 'Vállalkozásindítás'], kiemelt: true, tervezet: true,
      hataly: 'Tervezet: 2027. január 1-jétől lépne hatályba. Még nem elfogadott jogszabály.',
      cim: 'Új KATA 2027-től: társadalmi egyeztetésen a tervezet',
      osszefoglalo: 'Főállásban havi 100 000, mellékállásban 50 000 Ft tételes adó, 22 millió Ft-os bevételi határ, és újra lehetne cégeknek számlázni. A mostani katások a régi rendszerben maradhatnak.',
      torzs: [
        'Friss állapot (2026. október 21.): a javaslat továbbra is tervezet, az Országgyűlés elé még nem került. Ha a törvényt elfogadják, ezt az összefoglalót frissítjük.',
        'A Pénzügyminisztérium 2026. október 6-án társadalmi egyeztetésre bocsátotta a kisadózó vállalkozások tételes adójának (KATA) új szabályait. A tervezet még nem elfogadott törvény, a részletek változhatnak.',
        'A tervezet szerint 2027-től a főállású vállalkozók havi 100 000 Ft, a mellékállásúak havi 50 000 Ft tételes adót fizetnének. Újra választhatnák a KATA-t a nyugdíjasok, az egyetemi hallgatók és a mellékállású vállalkozók is.',
        'Az éves bevételi határ 18 millió forintról 22 millió forintra emelkedne, és ismét lehetne cégeknek is számlázni. A cégektől származó bevétel 15%-kal adózna, amelybe a megfizetett tételes adó beszámít. Egész évben havi 100 000 Ft-ot fizető főállású vállalkozónál 8 millió Ft éves céges bevétel felett keletkezne többletadó.',
        'A színlelt munkaviszonyok kiszűrésére: ha az éves bevétel legalább fele egyetlen megbízótól vagy annak kapcsolt vállalkozásaitól származik, a KATA-alanyiság az év végén megszűnik.',
        'Aki 2026. december 31-én katás, a régi rendszerben maradhat: neki a tételes adó 2027-ben havi 75 000 Ft, 2028-ban 100 000 Ft lenne. A két rendszer 2027-ben és 2028-ban párhuzamosan működne, a régi KATA 2029-ben szűnne meg.',
        'A főállású új katások ellátási alapja 2027-ben havi 317 000 Ft lenne, 2028-tól a mindenkori minimálbér. A mellékállású új katások a KATA alapján nem lennének biztosítottak.'
      ],
      forrasok: [
        { nev: 'Telex: Így változik a kata', url: 'https://telex.hu/gazdasag/2026/10/06/kata-adozas-valtozas-ekho-kiknek-hogyan-magyar-peter-bejelentes-reszletek', datum: '2026. 10. 06.' },
        { nev: 'Kontroll: Így változik a kata', url: 'https://kontroll.hu/cikk/belfold/2026/10/13/igy-valtozik-a-kata-megduplazodhat-a-foallasu-vallalkozok-adoja', datum: '2026. 10. 13.' },
        { nev: 'KATA 2027 – minden, amit eddig tudni lehet (kata2027.hu)', url: 'https://kata2027.hu/tudastar/kata-2027', datum: 'megtekintve 2026. 10. 21.' },
        { nev: 'KATA adózás 2027 – hírek (xprojekt.hu)', url: 'https://xprojekt.hu/kata-hirek', datum: 'megtekintve 2026. 10. 21.' }
      ],
      kapcsolodo: ['kata-2026-szabalyai']
    },
    {
      id: 'hataridok-2026-november-december', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['Éves adózási kötelezettségek', 'NAV tájékoztatók', 'ÁFA'],
      hataly: '2026. november–december',
      cim: 'Adózási határidők 2026 novemberében és decemberében',
      osszefoglalo: 'November 12., november 20., december 12. és december 21.: a havi bevallások és befizetések legközelebbi napjai.',
      torzs: [
        'A havi bevallók legközelebbi határnapjai az adónaptár szerint: 2026. november 12. (jövedelemadók, járulékok), 2026. november 20. (ÁFA, jövedelemadók), 2026. december 12. (jövedelemadók, járulékok) és 2026. december 21. (ÁFA, jövedelemadók).',
        'A KATA tételes adóját minden hónap 12-éig kell befizetni; ha ez munkaszüneti napra esik, a következő munkanapig.',
        'Hogy pontosan mely bevallások vonatkoznak az Ön vállalkozására, az a tevékenységtől és az adózási formától függ. Ebben szívesen segítünk.'
      ],
      forrasok: [
        { nev: 'Accace: Adónaptár', url: 'https://www.accace.hu/adonaptar/', datum: '2026. 10. 14.' },
        { nev: 'Financera: KATA 2026', url: 'https://financera.hu/szemelyes-penzugyek/kata-kisadozo-vallalkozok-teteles-adoja/', datum: '2026. 10. 04.' }
      ]
    },
    {
      id: 'kata-2026-szabalyai', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['KATA', 'Éves adózási kötelezettségek'],
      hataly: '2026-os adóév',
      cim: 'KATA 2026-ban: a legfontosabb szabályok',
      osszefoglalo: 'Havi 50 000 Ft, befizetés minden hónap 12-éig, 18 millió Ft-os éves bevételi határ, felette 40% adó. Csak főfoglalkozású egyéni vállalkozó választhatja.',
      torzs: [
        'A kisadózó vállalkozások tételes adója 2026-ban havi 50 000 Ft. A befizetési határidő minden hónap 12-e; ha ez munkaszüneti napra esik, a következő munkanap.',
        'Az éves bevételi határ 18 millió forint. Az e feletti bevételrész után 40%-os adót kell fizetni.',
        'A KATA-t 2026-ban csak főfoglalkozású egyéni vállalkozó választhatja, és csak magánszemélyeknek számlázhat (kivétel a személytaxis tevékenység).',
        'Az éves bevallás határideje a tárgyévet követő év február 25-e: a 2026-os évre tehát 2027. február 25.',
        'A 2027-re tervezett változásokról külön cikkünkben olvashat.'
      ],
      forrasok: [
        { nev: 'Financera: KATA 2026 – 50 000 Ft havonta, 18 millió Ft-os határ', url: 'https://financera.hu/szemelyes-penzugyek/kata-kisadozo-vallalkozok-teteles-adoja/', datum: '2026. 10. 04.' }
      ],
      kapcsolodo: ['uj-kata-2027-tervezet']
    },
    {
      id: 'alanyi-afa-mentesseg-2026', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['ÁFA', 'Vállalkozásindítás'],
      hataly: '2026. január 1-jétől; a 2027-es és 2028-as határral együtt',
      cim: 'Alanyi ÁFA-mentesség: 20 millió Ft-os értékhatár',
      osszefoglalo: 'Az alanyi adómentesség éves határa 18-ról 20 millió Ft-ra nőtt, 2027-ben 22, 2028-ban 24 millió Ft lesz.',
      torzs: [
        '2026. január 1-jétől az alanyi ÁFA-mentesség éves értékhatára 18 millió forintról 20 millió forintra emelkedett.',
        'A határ a következő években tovább nő: 2027-ben 22 millió, 2028-ban 24 millió forint lesz.'
      ],
      forrasok: [
        { nev: 'TaxHungary: Mi mennyi 2026-ban', url: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/', datum: '2026. 10. 14.' }
      ]
    },
    {
      id: 'atalanyado-2026', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['Átalányadózás', 'SZJA'],
      hataly: '2026-os adóév',
      cim: 'Átalányadó 2026: 45%-os költséghányad',
      osszefoglalo: 'Az általános költséghányad 45%-ra nőtt, a bevételi határ 38 736 000 Ft, az adómentes rész évi 1 936 800 Ft.',
      torzs: [
        'Az átalányadózó egyéni vállalkozók általános költséghányada 2026-tól 40%-ról 45%-ra emelkedett.',
        'Az átalányadózás bevételi határa 38 736 000 Ft; kizárólag kiskereskedelmi tevékenységet folytatóknál 193 680 000 Ft.',
        'Az éves adómentes jövedelemrész 1 936 800 Ft.'
      ],
      forrasok: [
        { nev: 'TaxHungary: Mi mennyi 2026-ban', url: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/', datum: '2026. 10. 14.' }
      ]
    },
    {
      id: 'minimalber-2026', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['Bérszámfejtés', 'Járulékok'],
      hataly: '2026. január 1-jétől',
      cim: 'Minimálbér és garantált bérminimum 2026-ban',
      osszefoglalo: 'A minimálbér havi 322 800 Ft, a garantált bérminimum 373 200 Ft. A járulékfizetési alsó határ 96 840 Ft.',
      torzs: [
        'A minimálbér 2026-ban havi 322 800 Ft, a legalább középfokú végzettséget igénylő munkakörökben fizetendő garantált bérminimum havi 373 200 Ft.',
        'A járulékfizetési alsó határ a minimálbér 30%-a, havi 96 840 Ft. Az egészségügyi szolgáltatási járulék havi 12 300 Ft (napi 410 Ft).',
        'A diákmunka havi minimuma a minimálbér 65%-a, 209 820 Ft.'
      ],
      forrasok: [
        { nev: 'TaxHungary: Mi mennyi 2026-ban', url: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/', datum: '2026. 10. 14.' }
      ],
      kapcsolodo: ['adokulcsok-2026']
    },
    {
      id: 'adokulcsok-2026', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['SZJA', 'Járulékok', 'Bérszámfejtés'],
      hataly: '2026-os adóév',
      cim: 'Adó- és járulékkulcsok 2026-ban',
      osszefoglalo: 'SZJA 15%, TB-járulék 18,5%, szociális hozzájárulási adó 13%, társasági adó 9%, KIVA 10%.',
      torzs: [
        'A személyi jövedelemadó mértéke 15%. A munkavállalói társadalombiztosítási járulék összesen 18,5% (10% nyugdíj-, 7% egészségbiztosítási, 1,5% munkaerőpiaci járulék).',
        'A munkáltatót terhelő szociális hozzájárulási adó 13%.',
        'A társasági adó mértéke 9%, a kisvállalati adóé (KIVA) 10%. A KATA tételes adója havi 50 000 Ft.'
      ],
      forrasok: [
        { nev: 'TaxHungary: Mi mennyi 2026-ban', url: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/', datum: '2026. 10. 14.' }
      ],
      kapcsolodo: ['minimalber-2026', 'tao-kiva-2026']
    },
    {
      id: 'tao-kiva-2026', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['TAO', 'KIVA'],
      hataly: '2026-os adóév',
      cim: 'Társasági adó vagy KIVA? A 2026-os kulcsok',
      osszefoglalo: 'A társasági adó 9%, a kisvállalati adó (KIVA) 10%. Hogy melyik a jobb, az nem a kulcson múlik.',
      torzs: [
        'A társasági adó (TAO) mértéke 2026-ban 9%, a kisvállalati adóé (KIVA) 10%.',
        'A két adó alapja eltér, ezért a kulcsok közvetlenül nem összevethetők. Hogy egy cégnél melyik adózási mód előnyösebb, az a bérköltségtől, az osztalékpolitikától és a cég eredményétől függ.',
        'Ha váltáson gondolkodik, érdemes a saját számaival együtt átnézni – ebben segítünk.'
      ],
      forrasok: [
        { nev: 'TaxHungary: Mi mennyi 2026-ban', url: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/', datum: '2026. 10. 14.' }
      ],
      kapcsolodo: ['adokulcsok-2026']
    },
    {
      id: 'anyak-szja-mentessege', datum: '2026-10-14', frissitve: '2026-10-14', statusz: 'kozzeteve',
      temak: ['SZJA', 'Bérszámfejtés'],
      hataly: '2025. október 1. – 2029, szakaszosan',
      cim: 'Az anyák SZJA-mentessége: szakaszos bővítés 2029-ig',
      osszefoglalo: 'A kétgyermekes anyák közül 2026-tól a 40 év alattiak mentesek, 2027-től 50, 2028-tól 60 év alatt, 2029-től korhatár nélkül.',
      torzs: [
        'A háromgyermekes anyák 2025. október 1-je óta mentesek a személyi jövedelemadó alól.',
        'A kétgyermekes anyák mentessége szakaszosan bővül: 2026. január 1-jétől a 40 év alattiak, 2027-től az 50 év alattiak, 2028-tól a 60 év alattiak, 2029-től minden kétgyermekes anya mentes.'
      ],
      forrasok: [
        { nev: 'TaxHungary: Mi mennyi 2026-ban', url: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/', datum: '2026. 10. 14.' }
      ]
    }
  ],

  /* ---------- Határidők (a lejártakat az oldal elrejti) ---------- */
  hataridok: [
    { datum: '2026-11-12', cim: 'Jövedelemadók, járulékok', leiras: 'havi bevallás és befizetés' },
    { datum: '2026-11-12', cim: 'KATA tételes adó', leiras: 'havi befizetés' },
    { datum: '2026-11-20', cim: 'ÁFA, jövedelemadók', leiras: 'havi bevallók' },
    { datum: '2026-12-12', cim: 'Jövedelemadók, járulékok', leiras: 'havi bevallás és befizetés' },
    { datum: '2026-12-21', cim: 'ÁFA, jövedelemadók', leiras: 'havi bevallók' },
    { datum: '2027-02-25', cim: 'KATA éves bevallás', leiras: 'a 2026-os adóévről' }
  ],
  hataridoForras: { nev: 'Accace Adónaptár', url: 'https://www.accace.hu/adonaptar/', datum: '2026. 10. 14.' },

  /* ---------- Jogszabályi idővonal ---------- */
  valtozasok: [
    { ev: '2027', cim: 'Új KATA', leiras: 'tervezet, társadalmi egyeztetésen', cikk: 'uj-kata-2027-tervezet', tervezet: true },
    { ev: '2027', cim: 'Alanyi ÁFA-határ 22 millió Ft', cikk: 'alanyi-afa-mentesseg-2026' },
    { ev: '2027', cim: 'SZJA-mentes: kétgyermekes anyák 50 év alatt', cikk: 'anyak-szja-mentessege' },
    { ev: '2028', cim: 'Alanyi ÁFA-határ 24 millió Ft', cikk: 'alanyi-afa-mentesseg-2026' },
    { ev: '2029', cim: 'SZJA-mentes: minden kétgyermekes anya', cikk: 'anyak-szja-mentessege' }
  ],

  /* ---------- Dokumentumtár (csak nyilvános, jóváhagyott anyag) ----------
     tipus: 'pdf' | 'link' · statusz: 'aktiv' | 'archiv' | 'minta' */
  dokKategoriak: ['Formanyomtatványok', 'Szakmai anyagok', 'Hivatalos online felületek'],
  dokumentumok: [
    { id: 'kulcsok', cim: 'Adó- és járulékkulcsok 2026 – összefoglaló', kategoria: 'Szakmai anyagok', tipus: 'pdf', fajl: 'dok/adokulcsok-2026.pdf', meret: 'PDF, 1 oldal', verzio: '1.1', datum: '2026-10-17', statusz: 'aktiv', leiras: 'Bér, járulék, KATA, átalányadó, ÁFA-határ – forrásmegjelöléssel' },
    { id: 'kulcsok-10', cim: 'Adó- és járulékkulcsok 2026 – összefoglaló', kategoria: 'Szakmai anyagok', tipus: 'pdf', fajl: '', meret: 'PDF', verzio: '1.0', datum: '2026-10-14', statusz: 'archiv', leiras: 'Előző változat – a 1.1 váltotta fel' },
    { id: 'adatlap', cim: 'Ügyféladatlap új ügyfeleknek', kategoria: 'Formanyomtatványok', tipus: 'pdf', fajl: 'dok/ugyfeladatlap.pdf', meret: 'PDF, 1 oldal', verzio: '0.9', datum: '2026-10-17', statusz: 'minta', leiras: 'Kitölthető adatlap a megbízás indulásához – jóváhagyásra vár' },
    { id: 'nav-ny', cim: 'NAV nyomtatványok', kategoria: 'Formanyomtatványok', tipus: 'link', fajl: 'https://nav.gov.hu/nyomtatvanyok', statusz: 'aktiv', leiras: 'Nyomtatványkereső, ÁNYK' },
    { id: 'onya', cim: 'ONYA – online nyomtatványkitöltés', kategoria: 'Formanyomtatványok', tipus: 'link', fajl: 'https://onya.nav.gov.hu', statusz: 'aktiv', leiras: 'NAV online nyomtatványkitöltő' },
    { id: 'eszja', cim: 'eSZJA', kategoria: 'Hivatalos online felületek', tipus: 'link', fajl: 'https://eszja.nav.gov.hu', statusz: 'aktiv', leiras: 'SZJA-bevallási tervezet' },
    { id: 'eafa', cim: 'eÁFA', kategoria: 'Hivatalos online felületek', tipus: 'link', fajl: 'https://eafa.nav.gov.hu', statusz: 'aktiv', leiras: 'Az ÁFA-bevallás NAV-felülete' },
    { id: 'osz', cim: 'Online Számla', kategoria: 'Hivatalos online felületek', tipus: 'link', fajl: 'https://onlineszamla.nav.gov.hu', statusz: 'aktiv', leiras: 'Számla-adatszolgáltatás' },
    { id: 'ebesz', cim: 'e-beszámoló', kategoria: 'Hivatalos online felületek', tipus: 'link', fajl: 'https://e-beszamolo.im.gov.hu', statusz: 'aktiv', leiras: 'Cégek éves beszámolói' }
  ],

  /* ---------- Szakmai linkek ---------- */
  linkek: [
    { nev: 'NAV', url: 'https://nav.gov.hu' },
    { nev: 'e-Cégjegyzék', url: 'https://www.e-cegjegyzek.hu' },
    { nev: 'Magyar Közlöny', url: 'https://magyarkozlony.hu' },
    { nev: 'Nemzeti Jogszabálytár', url: 'https://njt.hu' },
    { nev: 'Magyarország.hu', url: 'https://magyarorszag.hu' },
    { nev: 'KSH', url: 'https://www.ksh.hu' },
    { nev: 'MNB', url: 'https://www.mnb.hu' }
  ],

  /* ---------- Partnerek (MINDEN MINTA – valódi partner még nincs) ---------- */
  partnerKategoriak: ['Jogi szolgáltatás', 'Pénzügy és biztosítás', 'Informatika és szoftver', 'Marketing és kommunikáció'],
  partnerek: [
    { id: 'minta-jogi', nev: 'Minta Jogi Partner', rov: 'JP', kategoria: 'Jogi szolgáltatás', varos: 'Település', url: '', minta: true, kiemelt: true, allapot: 'jovahagyva',
      leiras: 'Rövid bemutatkozás – a partner adja meg jelentkezéskor.', szolg: ['Cégalapítás', 'Szerződések', 'Cégügyek'],
      miert: 'Itt jelenik meg, miért ajánlja a MultiCont ezt a partnert – az iroda saját szavaival.' },
    { id: 'minta-penzugy', nev: 'Minta Pénzügyi Partner', rov: 'PP', kategoria: 'Pénzügy és biztosítás', varos: 'Település', url: '', minta: true, kiemelt: true, allapot: 'jovahagyva',
      leiras: 'Rövid bemutatkozás – a partner adja meg jelentkezéskor.', szolg: ['Vállalkozói biztosítás', 'Finanszírozás'],
      miert: 'Itt jelenik meg, miért ajánlja a MultiCont ezt a partnert – az iroda saját szavaival.' },
    { id: 'minta-szoftver', nev: 'Minta Szoftverpartner', rov: 'SP', kategoria: 'Informatika és szoftver', varos: 'Település', url: '', minta: true, kiemelt: true, allapot: 'jovahagyva',
      leiras: 'Rövid bemutatkozás – a partner adja meg jelentkezéskor.', szolg: ['Számlázóprogram', 'Ügyviteli szoftver'],
      miert: 'Itt jelenik meg, miért ajánlja a MultiCont ezt a partnert – az iroda saját szavaival.' },
    { id: 'minta-marketing', nev: 'Minta Marketingpartner', rov: 'MP', kategoria: 'Marketing és kommunikáció', varos: 'Település', url: '', minta: true, allapot: 'fuggo',
      leiras: 'Jelentkezés – jóváhagyásra vár, ezért a nyilvános listán nem jelenik meg.', szolg: ['Weboldal', 'Arculat'], miert: '' }
  ],

  /* ---------- Ajánlatok, kuponok (MINTA) ---------- */
  ajanlatok: [
    { partner: 'minta-szoftver', cim: 'Első év kedvezménnyel', leiras: 'Minta: a partner által megadott kedvezmény szövege.', kod: 'MINTA-SZ10', lejarat: '2026-12-31', allapot: 'jovahagyva' },
    { partner: 'minta-jogi', cim: 'Ingyenes első konzultáció', leiras: 'Minta: a partner által megadott kedvezmény szövege.', kod: 'MINTA-JP01', lejarat: '2027-03-31', allapot: 'jovahagyva' },
    { partner: 'minta-penzugy', cim: 'Lejárt ajánlat (példa)', leiras: 'Minta: lejárt kupon – a nyilvános oldalon nem jelenik meg.', kod: 'MINTA-PP05', lejarat: '2026-09-30', allapot: 'jovahagyva' },
    { partner: 'minta-marketing', cim: 'Jóváhagyásra váró ajánlat', leiras: 'Minta: jóváhagyás előtt nem látszik.', kod: 'MINTA-MP15', lejarat: '2027-01-31', allapot: 'fuggo' }
  ]
};
