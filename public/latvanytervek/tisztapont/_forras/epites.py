#!/usr/bin/env python3
"""TisztaPont látványterv – építő.

Az _forras/adatok.json (központi adatok) és az _forras/sablon.html alapján
legenerálja az index.html-t és a js/adatok.js-t. Futtatás a mappából:

    python3 _forras/epites.py          # látványterv (alapértelmezett)
    python3 _forras/epites.py --eles   # csak 'kozzeteheto' referenciák, jelölések nélkül

Az --eles kapcsoló csak a referenciák és az egyeztetendő-jelölések szűrését
végzi; a demó időpontkérőt, a noindex beállítást és a látványterv-csíkot NEM
kapcsolja ki – az éles oldal külön munkafolyamat.
"""
import base64
import datetime
import hashlib
import html
import json
import pathlib
import re
import sys

from jinja2 import Environment, FileSystemLoader, select_autoescape

GYOKER = pathlib.Path(__file__).resolve().parent.parent
FORRAS = GYOKER / "_forras"
ADAT = json.loads((FORRAS / "adatok.json").read_text(encoding="utf-8"))
ELES = "--eles" in sys.argv

KAPCSOLAT_NEV = {
    "kozvetlen": "megbízó",
    "alvallalkozo": "alvállalkozóként",
    "korabbi_munkatarsi": "munkatársaink korábbi munkája",
}
# Mely állapotok jelenhetnek meg az adott módban
LATHATO = {"kozzeteheto"} if ELES else {"kozzeteheto", "igazolt", "ugyfel_altal_megadott"}


def szalag_tetelek():
    """Megjeleníthető referenciák, vagy ha nincs ilyen, a szolgáltatási területek.
    Visszaad: (címke, tételek, jóváhagyásra vár-e bármelyik)."""
    ok = [r for r in ADAT.get("referenciak", []) if r.get("allapot") in LATHATO]
    if ok:
        var = any(r["allapot"] != "kozzeteheto" for r in ok)
        return "Akiknél már dolgoztunk", [
            {
                "nev": r["nev"],
                "kapcsolat": KAPCSOLAT_NEV.get(r.get("kapcsolat")),
                "logo": r.get("logo") if r.get("logo_engedely") and r.get("logo") else None,
            }
            for r in ok
        ], var
    return "Terek, ahol dolgozunk", [{"nev": t, "kapcsolat": None, "logo": None} for t in ADAT["teruletek"]], False


def email_tort(email):
    """Hosszú e-mail-cím: tördelési pontok a pont és a @ előtt."""
    e = html.escape(email)
    return e.replace(".", ".<wbr>", 1).replace("@", "<wbr>@")


def csp_hash(oldal):
    """A <head> beágyazott szkriptjének sha256-hash-e a CSP-hez."""
    m = re.search(r"<script>(.*?)</script>", oldal, re.S)
    return "'sha256-" + base64.b64encode(hashlib.sha256(m.group(1).encode("utf-8")).digest()).decode() + "'"


def main():
    c = ADAT["ceg"]
    kat_nev = {k["id"]: k.get("egyes", k["nev"]) for k in ADAT["munkak_kategoriak"]}
    munkak = [dict(m, kat_nev=kat_nev[m["kat"]]) for m in ADAT["munkak"]]
    # csak az a szűrő jelenik meg, amelyhez tartozik kép
    kategoriak = [k for k in ADAT["munkak_kategoriak"] if any(m["kat"] == k["id"] for m in munkak)]

    szalag_cimke, szalag, szalag_jovahagyasra = szalag_tetelek()
    # két sor: fele-fele (a felső kapja a páratlan többletet); rövid sornál
    # kitöltő ismétlés, hogy széles képernyőn se maradjon üres sáv
    fel = (len(szalag) + 1) // 2
    szalag_sorok = []
    for tetelek in (szalag[:fel], szalag[fel:]) if len(szalag) > 1 else (szalag,):
        ism = max(1, -(-8 // len(tetelek)))  # legalább ~8 tétel egy példányban
        szalag_sorok.append({"tetelek": tetelek, "kitolto": tetelek * (ism - 1)})
    env = Environment(loader=FileSystemLoader(str(FORRAS)), autoescape=select_autoescape(["html"]))
    params = dict(
        c=c,
        o=ADAT["oldal"],
        v=ADAT["oldal"]["verzio"],
        szolg=ADAT["szolgaltatasok"],
        munkak=munkak,
        kategoriak=kategoriak,
        lepesek=ADAT["lepesek"],
        foglalas=ADAT["foglalas"],
        szalag=szalag,
        szalag_sorok=szalag_sorok,
        szalag_cimke=szalag_cimke,
        szalag_jovahagyasra=szalag_jovahagyasra and not ELES,
        cegadat_jeloles=bool(c.get("cegadatok_egyeztetendo")) and not ELES,
        email_tort=email_tort(c["email"]),
        ev=datetime.date.today().year,
        csp="",
    )
    tpl = env.get_template("sablon.html")
    out = tpl.render(**params)
    # második menet: a CSP a végleges head-szkript hash-ét kapja
    params["csp"] = csp_hash(out)
    out = tpl.render(**params)
    (GYOKER / "index.html").write_text(out, encoding="utf-8")

    # futásidejű adatok (időpontkérő, képnézegető)
    futas = {
        "telefon": c["telefon"],
        "telefonLink": c["telefon_link"],
        "email": c["email"],
        "foglalasMod": ADAT["foglalas"]["mod"],
        "szolgaltatasok": [{"id": s["id"], "cim": s["cim"]} for s in ADAT["szolgaltatasok"]],
        "munkak": [
            {"kep": m["kep"], "w": m["w"], "h": m["h"], "kat": m["kat"], "felirat": m["felirat"], "alt": m["alt"]}
            for m in munkak
        ],
    }
    (GYOKER / "js" / "adatok.js").write_text(
        "/* GENERÁLT FÁJL – ne szerkessze kézzel. Forrás: _forras/adatok.json, építő: _forras/epites.py */\n"
        "window.TP_ADATOK = " + json.dumps(futas, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print("kész:", GYOKER / "index.html", "(ÉLES szűrés)" if ELES else "(látványterv)",
          "| referenciák a szalagon:", len(szalag) if szalag_cimke != "Terek, ahol dolgozunk" else 0)


if __name__ == "__main__":
    main()
