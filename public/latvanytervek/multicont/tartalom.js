/* =========================================================
   MultiCont Center — SZERKESZTHETŐ TARTALOM
   Ebben az egy fájlban van minden, ami gyakran változik:
   adóhírek, az iroda saját dokumentumai, partnerek, kuponajánlat.
   Az élő oldalon ugyanezt egy szerkesztőfelületről lehet majd tölteni.
   ========================================================= */
window.TARTALOM = {

  /* ---- Adóhírek: a legújabb legyen elöl ---- */
  hirek: [
    {
      datum: '2026. október 6.',
      cimke: 'KATA',
      cim: 'Új KATA 2027-től: társadalmi egyeztetésen a tervezet',
      szoveg: 'A tervezet szerint 2027-től főállásban havi 100 000 Ft, mellékállásban 50 000 Ft a tételes adó, a bevételi határ 18-ról 22 millió Ft-ra nő, és ismét lehet cégeknek számlázni (az ebből származó bevétel 15%-kal adózik, a befizetett KATA beszámít). Aki 2026. december 31-én katás, a régi rendszerben maradhat: neki 2027-ben havi 75 000 Ft a tétel. Még nem elfogadott törvény.',
      forras: 'Telex',
      link: 'https://telex.hu/gazdasag/2026/10/06/kata-adozas-valtozas-ekho-kiknek-hogyan-magyar-peter-bejelentes-reszletek'
    },
    {
      datum: '2026. január 1.',
      cimke: 'ÁFA',
      cim: 'Alanyi adómentesség: 20 millió Ft-os értékhatár',
      szoveg: 'Az alanyi ÁFA-mentesség éves határa 18-ról 20 millió Ft-ra nőtt. A tervek szerint 2027-ben 22, 2028-ban 24 millió Ft lesz.',
      forras: 'TaxHungary',
      link: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/'
    },
    {
      datum: '2026. január 1.',
      cimke: 'Átalányadó',
      cim: '45%-os költséghányad az átalányadózóknak',
      szoveg: 'Az általános költséghányad 40-ről 45%-ra emelkedett. A bevételi határ 38 736 000 Ft (kizárólag kiskereskedőknél 193 680 000 Ft).',
      forras: 'TaxHungary',
      link: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/'
    },
    {
      datum: '2026. január 1.',
      cimke: 'Bér',
      cim: 'Minimálbér 322 800 Ft, garantált bérminimum 373 200 Ft',
      szoveg: 'A járulékfizetési alsó határ 96 840 Ft, az egészségügyi szolgáltatási járulék havi 12 300 Ft.',
      forras: 'TaxHungary',
      link: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/'
    },
    {
      datum: '2026. január 1.',
      cimke: 'SZJA',
      cim: 'SZJA-mentesek a 40 év alatti, kétgyermekes anyák',
      szoveg: 'A kétgyermekes anyák mentessége szakaszosan bővül: 2027-től 50, 2028-tól 60 év alatt, 2029-től korhatár nélkül. A háromgyermekes anyák 2025. október 1-je óta mentesek.',
      forras: 'TaxHungary',
      link: 'https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/'
    }
  ],

  /* ---- Az iroda saját anyagai (PDF, Word, Excel) ----
     Példa: { cim: 'Bizonylat-leadási útmutató', leiras: 'PDF, 2 oldal', fajl: 'dok/utmutato.pdf' } */
  dokumentumok: [],

  /* ---- Partnerek ----
     Példa: { nev: 'Partner Kft.', leiras: 'ügyvédi iroda', link: 'https://…' } */
  partnerek: [],

  /* ---- Kuponajánlat (null = a minta látszik) ----
     Példa: { szoveg: '…', kod: 'TAVASZ2027' } */
  kupon: null
};
