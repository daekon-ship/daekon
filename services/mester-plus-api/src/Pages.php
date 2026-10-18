<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Publikus, mobilra tervezett HTML-oldalak (online ajánlat, e-mail megerősítés, új jelszó).
 * Szkript nincs; a stílus nonce-szal engedélyezett (CSP); minden kiírt érték HTML-escape-elt.
 * Az űrlapok CSRF-védettek (dupla beküldés: SameSite=Strict süti + rejtett mező + Origin-ellenőrzés).
 */
final class Pages
{
    public function __construct(private App $app)
    {
    }

    // ── keret ────────────────────────────────────────────────────────────────

    public static function layout(string $title, string $body, string $nonce): string
    {
        $t = Util::h($title);
        return <<<HTML
<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>$t</title>
<style nonce="$nonce">
:root{--canvas:#F5F3EE;--surface:#fff;--line:#E2DED5;--ink:#151A23;--soft:#3A4150;--muted:#6B7180;--brand:#1B2B44;--accent:#E09A2C;--on-accent:#231703;--ok:#2F7A57;--ok-soft:#E2F1E8;--bad:#B83A26;--bad-soft:#F8E3DE;--warn-soft:#FCF1DC}
*{box-sizing:border-box}
body{margin:0;background:var(--canvas);color:var(--ink);font:16px/1.5 "IBM Plex Sans","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;-webkit-text-size-adjust:100%}
.top{background:var(--brand);color:#fff;padding:14px 16px}
.top b{font-weight:600;letter-spacing:-.01em}
main{max-width:720px;margin:0 auto;padding:16px 16px 40px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;margin:0 0 14px}
h1{font-size:1.35rem;line-height:1.25;margin:4px 0 6px;font-weight:600;overflow-wrap:anywhere}
h2{font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 10px;font-weight:600}
p{margin:0 0 8px}
.muted{color:var(--muted);font-size:.92rem}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:.95rem}
.kv dt{color:var(--muted)}.kv dd{margin:0;overflow-wrap:anywhere}
.line{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
.line:first-of-type{border-top:0}
.line .n{overflow-wrap:anywhere}.line .q{color:var(--muted);font-size:.9rem;font-variant-numeric:tabular-nums}
.line .s{white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:500}
.sum{display:flex;justify-content:space-between;gap:12px;padding:4px 0;font-variant-numeric:tabular-nums}
.sum.total{font-size:1.2rem;font-weight:600;border-top:1px solid var(--line);margin-top:6px;padding-top:10px}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:.85rem;font-weight:600}
.b-ok{background:var(--ok-soft);color:var(--ok)}.b-bad{background:var(--bad-soft);color:var(--bad)}.b-warn{background:var(--warn-soft);color:#7a4e0f}
.actions{display:grid;gap:10px;margin-top:6px}
.btn{display:block;width:100%;min-height:48px;padding:12px 16px;border-radius:12px;border:1px solid transparent;font:inherit;font-weight:600;text-align:center;text-decoration:none;cursor:pointer}
.btn-primary{background:var(--accent);color:var(--on-accent)}
.btn-secondary{background:var(--surface);color:var(--ink);border-color:var(--line)}
.btn-danger{background:var(--surface);color:var(--bad);border-color:#e6b9b0}
label.chk{display:flex;gap:10px;align-items:flex-start;padding:10px 0}
label.chk input{width:22px;height:22px;flex:none;margin-top:1px}
input[type=password]{width:100%;min-height:48px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;font:inherit;background:#fff}
pre.f{white-space:pre-wrap;font:inherit;margin:0;color:var(--soft)}
.mt{margin-top:10px}
footer{max-width:720px;margin:0 auto;padding:0 16px 32px;color:var(--muted);font-size:.85rem}
</style>
</head>
<body>
<div class="top"><b>Mester+</b></div>
<main>
$body
</main>
<footer>Az oldalt a Mester+ árajánlat-készítő generálta a vállalkozó kérésére. <a href="https://daekon-ship.github.io/daekon/mester-plus/adatvedelem.html">Adatvédelem</a></footer>
</body>
</html>
HTML;
    }

    public function respond(string $title, string $body, int $status = 200, array $extraHeaders = []): Response
    {
        $nonce = base64_encode(random_bytes(16));
        $r = Response::html(self::layout($title, $body, $nonce), $status);
        $r->headers += [
            'Content-Security-Policy' => "default-src 'none'; style-src 'nonce-$nonce'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
            'Referrer-Policy' => 'no-referrer',
            'X-Robots-Tag' => 'noindex, nofollow, noarchive',
            'Cache-Control' => 'no-store',
        ] + $extraHeaders;
        return $r;
    }

    public function message(string $title, string $text, int $status = 200): Response
    {
        return $this->respond($title, '<div class="card"><h1>' . Util::h($title) . '</h1><p>' . Util::h($text) . '</p></div>', $status);
    }

    // ── CSRF ─────────────────────────────────────────────────────────────────

    /** @return array{0:string,1:array<string,string>} [token, extra headers] */
    public function csrf(Request $req): array
    {
        $c = $req->cookies['mp_csrf'] ?? '';
        if (preg_match('/^[a-f0-9]{32}$/', $c)) {
            return [$c, []];
        }
        $c = bin2hex(random_bytes(16));
        return [$c, ['Set-Cookie' => "mp_csrf=$c; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=7200"]];
    }

    /** @param array<string,string> $form */
    public function csrfOk(Request $req, array $form): bool
    {
        $c = $req->cookies['mp_csrf'] ?? '';
        $f = $form['csrf'] ?? '';
        if (!preg_match('/^[a-f0-9]{32}$/', $c) || !hash_equals($c, $f)) {
            return false;
        }
        $origin = $req->header('origin');
        if ($origin !== '' && $origin !== 'null' && $req->host !== '') {
            $host = parse_url($origin, PHP_URL_HOST);
            if (!is_string($host) || strtolower($host) !== $req->host) {
                return false;
            }
        }
        return true;
    }

    // ── Online ajánlat ───────────────────────────────────────────────────────

    public static function huf(int $v): string
    {
        $s = number_format(abs($v), 0, ',', "\u{00A0}");
        return ($v < 0 ? '−' : '') . $s . "\u{00A0}Ft";
    }

    public static function qty(int $milli): string
    {
        $s = number_format($milli / 1000, 3, ',', "\u{00A0}");
        return rtrim(rtrim($s, '0'), ',');
    }

    public static function dateHu(string $ymd): string
    {
        return str_replace('-', '. ', $ymd) . '.';
    }

    /**
     * @param array<string,mixed> $row quote_shares sor
     * @param string $mode view|confirm-accept|confirm-decline
     */
    public function quote(Request $req, array $row, string $token, string $mode): Response
    {
        $snap = json_decode((string) $row['snapshot'], true);
        if (!is_array($snap) || !isset($snap['lines'])) {
            return $this->message('Az ajánlat nem érhető el', 'Ezt az ajánlatot a vállalkozó visszavonta.', 410);
        }
        $status = $this->app->quotes()->effectiveStatus($row);
        $s = $snap['seller'];
        $t = $snap['totals'];
        $h = [Util::class, 'h'];
        $base = '/a/' . $token;
        [$csrf, $hdr] = $this->csrf($req);

        $b = '<div class="card">';
        $b .= '<div class="muted">Árajánlat · ' . $h($snap['quote_number']) . ($snap['quote_version'] > 1 ? ' (' . (int) $snap['quote_version'] . '. változat)' : '') . '</div>';
        $b .= '<h1>' . $h($snap['project']['title']) . '</h1>';
        $b .= match ($status) {
            'ACCEPTED' => '<p><span class="badge b-ok">Ajánlat elfogadva</span> <span class="muted">' . $h($this->localTime($row['decided_at'])) . '</span></p>',
            'DECLINED' => '<p><span class="badge b-bad">Ajánlat elutasítva</span></p>',
            'EXPIRED' => '<p><span class="badge b-warn">Az ajánlat lejárt</span></p>',
            'REVOKED' => '<p><span class="badge b-warn">A vállalkozó visszavonta</span></p>',
            default => '',
        };
        $b .= '<dl class="kv">';
        $b .= '<dt>Vállalkozó</dt><dd>' . $h($s['company_name']) . ($s['owner_name'] !== '' ? '<br><span class="muted">' . $h($s['owner_name']) . '</span>' : '') . '</dd>';
        $b .= '<dt>Megrendelő</dt><dd>' . $h($snap['customer']['name']) . '</dd>';
        if ($snap['project']['site_address'] !== '') {
            $b .= '<dt>Helyszín</dt><dd>' . $h($snap['project']['site_address']) . '</dd>';
        }
        $b .= '<dt>Ajánlat dátuma</dt><dd>' . $h(self::dateHu($snap['quoted_at'])) . '</dd>';
        $b .= '<dt>Érvényes</dt><dd>' . $h(rtrim(self::dateHu($snap['valid_until']), '.')) . '-ig</dd>';
        if ($s['tax_number'] !== '') {
            $b .= '<dt>Adószám</dt><dd>' . $h($s['tax_number']) . '</dd>';
        }
        $b .= '</dl></div>';

        $b .= '<div class="card"><h2>Tételek</h2>';
        foreach ($snap['lines'] as $i => $l) {
            $unitPrice = $l['labor_unit_price_huf'] + $l['material_unit_price_huf'];
            $b .= '<div class="line"><div><div class="n">' . $h($l['name']) . '</div><div class="q">' . $h(self::qty($l['quantity_milli'])) . "\u{00A0}" . $h($l['unit'])
                . ' × ' . $h(self::huf($unitPrice)) . '</div></div><div class="s">' . $h(self::huf((int) $t['lines'][$i]['total_huf'])) . '</div></div>';
        }
        $b .= '</div>';

        $b .= '<div class="card"><h2>Összesítő</h2>';
        $b .= '<div class="sum"><span>Munkadíj</span><span>' . $h(self::huf($t['labor_subtotal_huf'])) . '</span></div>';
        $b .= '<div class="sum"><span>Anyag</span><span>' . $h(self::huf($t['material_subtotal_huf'])) . '</span></div>';
        if ($t['adjustment_huf'] !== 0) {
            $label = $snap['adjustment']['type'] === 'discount' ? 'Kedvezmény' : 'Felár';
            $pct = rtrim(rtrim(number_format($snap['adjustment']['percent_bp'] / 100, 2, ',', ''), '0'), ',');
            $b .= '<div class="sum"><span>' . $label . ' (' . $h($pct) . '%)</span><span>' . $h(self::huf($t['adjustment_huf'])) . '</span></div>';
        }
        $vatPct = rtrim(rtrim(number_format($snap['vat_rate_bp'] / 100, 2, ',', ''), '0'), ',');
        $b .= '<div class="sum"><span>Nettó</span><span>' . $h(self::huf($t['net_total_huf'])) . '</span></div>';
        $b .= '<div class="sum"><span>ÁFA (' . $h($vatPct) . '%)</span><span>' . $h(self::huf($t['vat_huf'])) . '</span></div>';
        $b .= '<div class="sum total"><span>Bruttó végösszeg</span><span>' . $h(self::huf($t['gross_total_huf'])) . '</span></div>';
        $b .= '</div>';

        if ($snap['footer'] !== '') {
            $b .= '<div class="card"><h2>Feltételek</h2><pre class="f">' . $h($snap['footer']) . '</pre></div>';
        }

        if ($status === 'ACTIVE') {
            if ($mode === 'confirm-accept' || $mode === 'confirm-decline') {
                $acc = $mode === 'confirm-accept';
                $b .= '<div class="card"><h2>' . ($acc ? 'Elfogadás megerősítése' : 'Elutasítás megerősítése') . '</h2>';
                $b .= '<form method="post" action="' . $h($base . ($acc ? '/elfogadom' : '/nem-kerem')) . '">';
                $b .= '<input type="hidden" name="csrf" value="' . $h($csrf) . '">';
                $b .= '<input type="hidden" name="hash" value="' . $h($row['snapshot_hash']) . '">';
                if ($acc) {
                    $b .= '<p>Elfogadod a(z) <b>' . $h($snap['quote_number']) . '</b> számú ajánlatot <b>' . $h(self::huf($t['gross_total_huf'])) . '</b> bruttó végösszeggel?</p>';
                    $b .= '<label class="chk"><input type="checkbox" name="ok" value="1" required> <span>Elolvastam az ajánlatot, és elfogadom a fenti tételekkel és feltételekkel.</span></label>';
                } else {
                    $b .= '<p>Biztosan nem kéred ezt az ajánlatot? A vállalkozó értesül a döntésedről.</p>';
                }
                $b .= '<div class="actions"><button class="btn ' . ($acc ? 'btn-primary' : 'btn-danger') . '" type="submit">' . ($acc ? 'Igen, elfogadom' : 'Igen, nem kérem') . '</button>';
                $b .= '<a class="btn btn-secondary" href="' . $h($base) . '">Vissza</a></div></form>';
                $b .= '<p class="muted mt">Az elfogadás rögzíti a döntésedet az ajánlat pontos tartalmával és időpontjával. Ez nem minősített elektronikus aláírás.</p></div>';
            } else {
                $b .= '<div class="card"><div class="actions">';
                $b .= '<a class="btn btn-primary" href="' . $h($base . '/elfogadom') . '">ELFOGADOM</a>';
                $b .= '<a class="btn btn-danger" href="' . $h($base . '/nem-kerem') . '">NEM KÉREM</a>';
                $b .= '<a class="btn btn-secondary" href="#kerdes">KÉRDÉSEM VAN</a>';
                $b .= '</div></div>';
            }
        }
        $b .= '<div class="card" id="kerdes"><h2>Kérdésed van?</h2><p>Keresd közvetlenül a vállalkozót:</p><div class="actions">';
        if ($s['phone'] !== '') {
            $b .= '<a class="btn btn-secondary" href="tel:' . $h(preg_replace('/[^0-9+]/', '', $s['phone'])) . '">Hívás: ' . $h($s['phone']) . '</a>';
        }
        if ($s['email'] !== '') {
            $b .= '<a class="btn btn-secondary" href="mailto:' . $h($s['email']) . '?subject=' . rawurlencode('Kérdés: ' . $snap['quote_number']) . '">E-mail: ' . $h($s['email']) . '</a>';
        }
        if ($s['phone'] === '' && $s['email'] === '') {
            $b .= '<p class="muted">A vállalkozó elérhetősége nincs megadva az ajánlaton.</p>';
        }
        $b .= '</div></div>';
        return $this->respond('Árajánlat – ' . $snap['quote_number'], $b, 200, $hdr);
    }

    private function localTime(?string $sqlUtc): string
    {
        $ts = Clock::ts($sqlUtc);
        if ($ts === null) {
            return '';
        }
        return (new \DateTimeImmutable('@' . $ts))->setTimezone(new \DateTimeZone('Europe/Budapest'))->format('Y. m. d. H:i');
    }

    // ── E-mail megerősítés, új jelszó ────────────────────────────────────────

    public function verifyForm(Request $req, string $token): Response
    {
        [$csrf, $hdr] = $this->csrf($req);
        $b = '<div class="card"><h1>E-mail cím megerősítése</h1><p>Erősítsd meg, hogy ez az e-mail cím a tiéd.</p>'
            . '<form method="post" action="/v/' . Util::h($token) . '"><input type="hidden" name="csrf" value="' . Util::h($csrf) . '">'
            . '<div class="actions"><button class="btn btn-primary" type="submit">Megerősítem</button></div></form></div>';
        return $this->respond('E-mail megerősítése – Mester+', $b, 200, $hdr);
    }

    public function resetForm(Request $req, string $token, string $error = ''): Response
    {
        [$csrf, $hdr] = $this->csrf($req);
        $b = '<div class="card"><h1>Új jelszó beállítása</h1>' . ($error !== '' ? '<p><span class="badge b-bad">' . Util::h($error) . '</span></p>' : '')
            . '<form method="post" action="/r/' . Util::h($token) . '"><input type="hidden" name="csrf" value="' . Util::h($csrf) . '">'
            . '<p><label>Új jelszó (legalább 10 karakter)<br><input type="password" name="password" minlength="10" maxlength="200" autocomplete="new-password" required></label></p>'
            . '<p><label>Új jelszó még egyszer<br><input type="password" name="password2" minlength="10" maxlength="200" autocomplete="new-password" required></label></p>'
            . '<div class="actions"><button class="btn btn-primary" type="submit">Jelszó mentése</button></div></form>'
            . '<p class="muted mt">A mentés után minden eszközön újra be kell jelentkezned.</p></div>';
        return $this->respond('Új jelszó – Mester+', $b, 200, $hdr);
    }

    public function serviceHome(): Response
    {
        $b = '<div class="card"><h1>Mester+ Cloud</h1><p>A Mester+ árajánlat-készítő app felhős szolgáltatása (fiók, felhőmentés, online ajánlat).</p>'
            . '<p class="muted">Ez a cím az appnak szól; böngészőből nincs itt teendőd.</p>'
            . '<div class="actions"><a class="btn btn-secondary" href="https://daekon-ship.github.io/daekon/mester-plus/">A Mester+ appról</a></div></div>';
        return $this->respond('Mester+ Cloud', $b);
    }
}
