#!/usr/bin/env python3
"""TisztaPont látványterv – építő.

Az _forras/adatok.json (központi adatok) és az _forras/sablon.html alapján
legenerálja az index.html-t és a js/adatok.js-t. Futtatás a mappából:

    python3 _forras/epites.py
"""
import datetime
import html
import json
import pathlib

from jinja2 import Environment, FileSystemLoader, select_autoescape

GYOKER = pathlib.Path(__file__).resolve().parent.parent
FORRAS = GYOKER / "_forras"
ADAT = json.loads((FORRAS / "adatok.json").read_text(encoding="utf-8"))

KAPCSOLAT_NEV = {
    "kozvetlen": "megbízó",
    "alvallalkozo": "alvállalkozóként",
    "korabbi_munkatarsi": "munkatársaink korábbi munkája",
}


def szalag_tetelek():
    """Jóváhagyott referenciák, vagy ha nincs ilyen, a szolgáltatási területek."""
    ok = [r for r in ADAT.get("referenciak", []) if r.get("szoveg_jovahagyva")]
    if ok:
        return "Referenciák", [
            {
                "nev": r["nev"],
                "kapcsolat": KAPCSOLAT_NEV.get(r.get("kapcsolat")),
                "logo": r.get("logo") if r.get("logo_engedely") else None,
            }
            for r in ok
        ]
    return "Terek, ahol dolgozunk", [{"nev": t, "kapcsolat": None, "logo": None} for t in ADAT["teruletek"]]


def email_tort(email):
    """Hosszú e-mail-cím: tördelési pontok a pont és a @ előtt."""
    e = html.escape(email)
    return e.replace(".", ".<wbr>", 1).replace("@", "<wbr>@")


def main():
    c = ADAT["ceg"]
    kat_nev = {k["id"]: k.get("egyes", k["nev"]) for k in ADAT["munkak_kategoriak"]}
    munkak = [dict(m, kat_nev=kat_nev[m["kat"]]) for m in ADAT["munkak"]]
    # csak az a szűrő jelenik meg, amelyhez tartozik kép
    kategoriak = []
    for k in ADAT["munkak_kategoriak"]:
        db = sum(1 for m in munkak if m["kat"] == k["id"])
        if db:
            kategoriak.append({**k, "db": db})

    szalag_cimke, szalag = szalag_tetelek()
    env = Environment(loader=FileSystemLoader(str(FORRAS)), autoescape=select_autoescape(["html"]))
    out = env.get_template("sablon.html").render(
        c=c,
        o=ADAT["oldal"],
        v=ADAT["oldal"]["verzio"],
        szolg=ADAT["szolgaltatasok"],
        munkak=munkak,
        kategoriak=kategoriak,
        lepesek=ADAT["lepesek"],
        foglalas=ADAT["foglalas"],
        szalag=szalag,
        szalag_cimke=szalag_cimke,
        email_tort=email_tort(c["email"]),
        ev=datetime.date.today().year,
    )
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
    print("kész:", GYOKER / "index.html")


if __name__ == "__main__":
    main()
