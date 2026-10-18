<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * ONLINE AJÁNLAT: megváltoztathatatlan pillanatkép (snapshot) + kitalálhatatlan publikus link.
 * A szerverre CSAK az ajánlathoz szükséges adat kerül (nem az ügyféladatbázis): eladó-adatok, az ügyfél
 * megjelenített neve, projekt-cím, tételek, összegek, feltételek.
 */
final class Quotes
{
    public const MAX_LINES = 300;
    public const SNAPSHOT_SCHEMA = 1;
    private const UNITS = ['m²', 'fm', 'm³', 'db', 'óra', 'klt'];
    /** Link-előnézetet készítő robotok: a „megnyitva” állapotot nem ők váltják ki (UA nem tárolódik). */
    private const PREVIEW_BOTS = '/facebookexternalhit|whatsapp|viber|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|skypeuripreview|googlebot|bingbot|applebot|google-pagerenderer|embedly|outlook|microsoft office|bot\b|crawler|spider|preview/i';

    public function __construct(private App $app)
    {
    }

    // ── Pillanatkép ellenőrzése ──────────────────────────────────────────────

    /** @param mixed $s @return array<string,mixed> kanonikus pillanatkép (ismeretlen mezők nélkül) */
    public static function normalize(mixed $s): array
    {
        $bad = static fn (string $what) => new ApiError(422, 'INVALID_SNAPSHOT', "Hibás ajánlat-adat: $what.");
        if (!is_array($s) || ($s['schema'] ?? null) !== self::SNAPSHOT_SCHEMA) {
            throw $bad('formátum');
        }
        $txt = static function (mixed $v, int $max, string $what, bool $required = false, bool $multi = false) use ($bad): string {
            if ($v === null && !$required) {
                return '';
            }
            $c = Util::cleanText($v, $max, $multi);
            if ($c === null || ($required && $c === '')) {
                throw $bad($what);
            }
            return $c;
        };
        $int = static function (mixed $v, int $min, int $max, string $what) use ($bad): int {
            if (!is_int($v) || $v < $min || $v > $max) {
                throw $bad($what);
            }
            return $v;
        };
        $date = static function (mixed $v, string $what) use ($bad): string {
            if (!is_string($v) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
                throw $bad($what);
            }
            return $v;
        };
        $qn = $txt($s['quote_number'] ?? null, 40, 'ajánlatszám', true);
        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9\/_.-]{0,39}$/', $qn)) {
            throw $bad('ajánlatszám');
        }
        $seller = is_array($s['seller'] ?? null) ? $s['seller'] : [];
        $customer = is_array($s['customer'] ?? null) ? $s['customer'] : [];
        $project = is_array($s['project'] ?? null) ? $s['project'] : [];
        $adj = is_array($s['adjustment'] ?? null) ? $s['adjustment'] : [];
        $adjType = $adj['type'] ?? 'none';
        if (!in_array($adjType, ['none', 'discount', 'surcharge'], true)) {
            throw $bad('kedvezmény típusa');
        }
        $lines = $s['lines'] ?? null;
        if (!is_array($lines) || !array_is_list($lines) || $lines === [] || count($lines) > self::MAX_LINES) {
            throw $bad('tételek');
        }
        $normLines = [];
        foreach ($lines as $l) {
            if (!is_array($l)) {
                throw $bad('tétel');
            }
            $unit = $txt($l['unit'] ?? null, 8, 'mértékegység', true);
            if (!in_array($unit, self::UNITS, true)) {
                throw $bad('mértékegység');
            }
            $normLines[] = [
                'name' => $txt($l['name'] ?? null, 200, 'tétel neve', true),
                'unit' => $unit,
                'quantity_milli' => $int($l['quantity_milli'] ?? null, 1, 999_999_000, 'mennyiség'),
                'labor_unit_price_huf' => $int($l['labor_unit_price_huf'] ?? null, 0, 99_999_999, 'munkadíj'),
                'material_unit_price_huf' => $int($l['material_unit_price_huf'] ?? null, 0, 99_999_999, 'anyagár'),
            ];
        }
        $quotedAt = $date($s['quoted_at'] ?? null, 'ajánlat dátuma');
        $validUntil = $date($s['valid_until'] ?? null, 'érvényesség');
        if ($validUntil < $quotedAt) {
            throw $bad('érvényesség');
        }
        $email = $txt($seller['email'] ?? null, 254, 'e-mail');
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $email = '';
        }
        $phone = $txt($seller['phone'] ?? null, 40, 'telefon');
        if ($phone !== '' && !preg_match('/^[0-9+()\/ -]{3,40}$/', $phone)) {
            $phone = '';
        }
        return [
            'schema' => self::SNAPSHOT_SCHEMA,
            'quote_number' => $qn,
            'quote_version' => $int($s['quote_version'] ?? null, 1, 999, 'verzió'),
            'quoted_at' => $quotedAt,
            'valid_until' => $validUntil,
            'seller' => [
                'company_name' => $txt($seller['company_name'] ?? null, 200, 'cégnév', true),
                'owner_name' => $txt($seller['owner_name'] ?? null, 200, 'kapcsolattartó'),
                'address' => $txt($seller['address'] ?? null, 300, 'cím'),
                'tax_number' => $txt($seller['tax_number'] ?? null, 20, 'adószám'),
                'phone' => $phone,
                'email' => $email,
            ],
            'customer' => ['name' => $txt($customer['name'] ?? null, 200, 'ügyfél neve', true)],
            'project' => [
                'title' => $txt($project['title'] ?? null, 200, 'projekt', true),
                'site_address' => $txt($project['site_address'] ?? null, 300, 'helyszín'),
            ],
            'lines' => $normLines,
            'adjustment' => ['type' => $adjType, 'percent_bp' => $int($adj['percent_bp'] ?? 0, 0, 10000, 'kedvezmény mértéke')],
            'vat_rate_bp' => $int($s['vat_rate_bp'] ?? null, 0, 10000, 'ÁFA'),
            'footer' => $txt($s['footer'] ?? null, 600, 'lábléc', false, true),
        ];
    }

    /**
     * A pillanatkép összegei a közös szabállyal; eltérés esetén elutasítás.
     * @param array<string,mixed> $snap @param mixed $clientTotals @return array<string,mixed>
     */
    public static function verifyTotals(array $snap, mixed $clientTotals): array
    {
        try {
            $t = QuoteCalculator::calculate($snap['lines'], $snap['adjustment']['type'], $snap['adjustment']['percent_bp'], $snap['vat_rate_bp']);
        } catch (\OverflowException) {
            throw new ApiError(422, 'INVALID_SNAPSHOT', 'Az ajánlat összege túl nagy.');
        }
        if ($t['unpriced_line_count'] > 0) {
            throw new ApiError(422, 'UNPRICED_LINES', 'Az ajánlatban van ár nélküli tétel. Árazd be, mielőtt online elküldöd.');
        }
        $keys = ['labor_subtotal_huf', 'material_subtotal_huf', 'adjustment_huf', 'net_total_huf', 'vat_huf', 'gross_total_huf'];
        if (!is_array($clientTotals)) {
            throw new ApiError(422, 'TOTALS_MISMATCH', 'Az ajánlat összesítője hiányzik.');
        }
        foreach ($keys as $k) {
            if (($clientTotals[$k] ?? null) !== $t[$k]) {
                throw new ApiError(422, 'TOTALS_MISMATCH', 'Az ajánlat összege nem egyezik a számítással. Frissítsd az appot.', ['field' => $k]);
            }
        }
        $cl = $clientTotals['lines'] ?? null;
        if (!is_array($cl) || count($cl) !== count($t['lines'])) {
            throw new ApiError(422, 'TOTALS_MISMATCH', 'Az ajánlat tételösszegei nem egyeznek.');
        }
        foreach ($t['lines'] as $i => $lt) {
            if (($cl[$i]['total_huf'] ?? null) !== $lt['total_huf']) {
                throw new ApiError(422, 'TOTALS_MISMATCH', 'Az ajánlat tételösszegei nem egyeznek.', ['line' => $i]);
            }
        }
        return $t;
    }

    // ── API (vállalkozó) ─────────────────────────────────────────────────────

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public function create(Request $req, array $in): array
    {
        $this->app->entitlements()->require($req, 'online_quotes');
        $this->app->guard()->limit('quote_create', 'acc:' . $req->auth['account_id']);
        $snap = self::normalize($in['snapshot'] ?? null);
        $totals = self::verifyTotals($snap, $in['totals'] ?? null);
        $today = (new \DateTimeImmutable('@' . Clock::now()))->setTimezone(new \DateTimeZone('Europe/Budapest'))->format('Y-m-d');
        if ($snap['valid_until'] < $today) {
            throw new ApiError(422, 'QUOTE_EXPIRED', 'Az ajánlat érvényessége már lejárt. Állíts be új érvényességet.');
        }
        $snap['totals'] = $totals;
        $snap['generated_at'] = gmdate('Y-m-d\TH:i:s\Z', Clock::now());
        $ws = $req->auth['workspace_id'];
        $db = $this->app->db();
        $token = Util::token();
        $pub = Util::publicId();
        $id = $db->tx(function () use ($db, $ws, $snap, $token, $pub, $req) {
            // Ugyanannak az ajánlatnak egy élő linkje lehet: az új verzió a régit visszavonja.
            foreach ($db->all("SELECT id FROM quote_shares WHERE workspace_id = ? AND quote_number = ? AND status = 'ACTIVE' FOR UPDATE", [$ws, $snap['quote_number']]) as $old) {
                $db->run("UPDATE quote_shares SET status = 'REVOKED', revoked_at = ? WHERE id = ?", [Clock::sql(), $old['id']]);
                $db->insert('quote_events', ['quote_share_id' => $old['id'], 'type' => 'REVOKED', 'created_at' => Clock::sql()]);
            }
            $ver = (int) $db->val('SELECT COALESCE(MAX(quote_version), 0) + 1 FROM quote_shares WHERE workspace_id = ? AND quote_number = ?', [$ws, $snap['quote_number']]);
            $snap['quote_version'] = $ver; // a verziót a szerver osztja ki (az app értéke csak javaslat)
            $json = json_encode($snap, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $id = $db->insert('quote_shares', [
                'public_id' => $pub, 'workspace_id' => $ws, 'device_id' => $req->auth['device_id'], 'quote_number' => $snap['quote_number'],
                'quote_version' => $ver, 'token_hash' => Util::tokenHash($token, $this->app->pepper()), 'snapshot' => $json,
                'snapshot_hash' => hash('sha256', $json), 'gross_total_huf' => $snap['totals']['gross_total_huf'], 'valid_until' => $snap['valid_until'],
                'status' => 'ACTIVE', 'created_at' => Clock::sql(),
            ]);
            $db->insert('quote_events', ['quote_share_id' => $id, 'type' => 'CREATED', 'created_at' => Clock::sql()]);
            return $id;
        });
        $this->app->guard()->audit('QUOTE_CREATED', $req, null, null, $pub);
        return $this->view($db->one('SELECT * FROM quote_shares WHERE id = ?', [$id])) + ['url' => $this->app->publicBase('quote') . '/a/' . $token];
    }

    /** @return list<array<string,mixed>> */
    public function list(Request $req, ?string $quoteNumber): array
    {
        $this->app->entitlements()->require($req, 'online_quotes');
        $ws = $req->auth['workspace_id'];
        $rows = $quoteNumber !== null
            ? $this->app->db()->all('SELECT * FROM quote_shares WHERE workspace_id = ? AND quote_number = ? ORDER BY quote_version DESC LIMIT 20', [$ws, $quoteNumber])
            : $this->app->db()->all('SELECT * FROM quote_shares WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200', [$ws]);
        return array_map(fn ($r) => $this->view($r), $rows);
    }

    /** @return array<string,mixed> */
    public function get(Request $req, string $id): array
    {
        return $this->view($this->find($req, $id));
    }

    /** @return array<string,mixed> */
    public function revoke(Request $req, string $id): array
    {
        $r = $this->find($req, $id);
        $db = $this->app->db();
        if ($db->run("UPDATE quote_shares SET status = 'REVOKED', revoked_at = ? WHERE id = ? AND status = 'ACTIVE'", [Clock::sql(), $r['id']])->rowCount() === 1) {
            $db->insert('quote_events', ['quote_share_id' => $r['id'], 'type' => 'REVOKED', 'created_at' => Clock::sql()]);
            $this->app->guard()->audit('QUOTE_REVOKED', $req, null, null, $r['public_id']);
        }
        return $this->view($this->find($req, $id));
    }

    /** @return array<string,mixed> */
    private function find(Request $req, string $id): array
    {
        $r = Util::isPublicId($id) ? $this->app->db()->one('SELECT * FROM quote_shares WHERE public_id = ? AND workspace_id = ?', [$id, $req->auth['workspace_id']]) : null;
        if ($r === null) {
            throw new ApiError(404, 'NOT_FOUND', 'Nincs ilyen online ajánlat.');
        }
        return $r;
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private function view(array $r): array
    {
        return [
            'id' => $r['public_id'], 'quote_number' => $r['quote_number'], 'quote_version' => (int) $r['quote_version'],
            'status' => $this->effectiveStatus($r), 'opened' => $r['first_opened_at'] !== null,
            'first_opened_at' => Clock::iso($r['first_opened_at']), 'last_opened_at' => Clock::iso($r['last_opened_at']),
            'decided_at' => Clock::iso($r['decided_at']), 'revoked_at' => Clock::iso($r['revoked_at']),
            'valid_until' => $r['valid_until'], 'gross_total_huf' => (int) $r['gross_total_huf'], 'snapshot_hash' => $r['snapshot_hash'],
            'created_at' => Clock::iso($r['created_at']),
        ];
    }

    /** @param array<string,mixed> $r */
    public function effectiveStatus(array $r): string
    {
        if ($r['status'] === 'ACTIVE' && $r['valid_until'] < $this->today()) {
            return 'EXPIRED';
        }
        return $r['status'];
    }

    public function today(): string
    {
        return (new \DateTimeImmutable('@' . Clock::now()))->setTimezone(new \DateTimeZone('Europe/Budapest'))->format('Y-m-d');
    }

    // ── Publikus oldal (ügyfél) ──────────────────────────────────────────────

    /** @return array<string,mixed>|null */
    public function byToken(Request $req, string $token): ?array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/', $token)) {
            $this->app->guard()->limit('public_quote_invalid', $req->ip);
            return null;
        }
        $r = $this->app->db()->one('SELECT * FROM quote_shares WHERE token_hash = ?', [Util::tokenHash($token, $this->app->pepper())]);
        if ($r === null) {
            $this->app->guard()->limit('public_quote_invalid', $req->ip);
        }
        return $r;
    }

    /** @param array<string,mixed> $r */
    public function recordOpen(Request $req, array $r): void
    {
        if (preg_match(self::PREVIEW_BOTS, $req->header('user-agent')) || $req->header('user-agent') === '' || $r['status'] === 'REVOKED') {
            return;
        }
        $db = $this->app->db();
        $now = Clock::sql();
        $db->run('UPDATE quote_shares SET first_opened_at = COALESCE(first_opened_at, ?), last_opened_at = ?, open_count = open_count + 1 WHERE id = ?', [$now, $now, $r['id']]);
        // Esemény: az első megnyitás, utána legfeljebb óránként egy (ne nőjön korlátlanul).
        $last = $db->val("SELECT MAX(created_at) FROM quote_events WHERE quote_share_id = ? AND type = 'OPENED'", [$r['id']]);
        if ($last === null || (Clock::ts((string) $last) ?? 0) < Clock::now() - 3600) {
            $db->insert('quote_events', ['quote_share_id' => $r['id'], 'type' => 'OPENED', 'created_at' => $now, 'ip_hash' => Util::ipHash($req->ip, $this->app->pepper())]);
            $this->app->guard()->audit('QUOTE_VIEWED', $req, null, (int) $r['workspace_id'], $r['public_id']);
        }
    }

    /** Elfogadás / elutasítás – atomikus, csak ACTIVE és érvényes ajánlatra; dupla kattintás nem hoz létre második eseményt. */
    public function decide(Request $req, array $r, string $decision): bool
    {
        $type = $decision === 'accept' ? 'ACCEPTED' : 'DECLINED';
        $db = $this->app->db();
        $ok = $db->run("UPDATE quote_shares SET status = ?, decided_at = ? WHERE id = ? AND status = 'ACTIVE' AND valid_until >= ?",
            [$type, Clock::sql(), $r['id'], $this->today()])->rowCount() === 1;
        if ($ok) {
            $db->insert('quote_events', ['quote_share_id' => $r['id'], 'type' => $type, 'created_at' => Clock::sql(), 'ip_hash' => Util::ipHash($req->ip, $this->app->pepper())]);
            $this->app->guard()->audit($decision === 'accept' ? 'QUOTE_ACCEPTED' : 'QUOTE_DECLINED', $req, null, (int) $r['workspace_id'], $r['public_id'], ['tartalom_sha256' => $r['snapshot_hash']]);
        }
        return $ok;
    }

    /** Karbantartás: lejárt ajánlatok EXPIRED-re (eseménnyel), régi IP-kivonatok törlése (30 nap). */
    public function maintain(): array
    {
        $db = $this->app->db();
        $n = 0;
        foreach ($db->all("SELECT id FROM quote_shares WHERE status = 'ACTIVE' AND valid_until < ? LIMIT 1000", [$this->today()]) as $r) {
            if ($db->run("UPDATE quote_shares SET status = 'EXPIRED' WHERE id = ? AND status = 'ACTIVE'", [$r['id']])->rowCount() === 1) {
                $db->insert('quote_events', ['quote_share_id' => $r['id'], 'type' => 'EXPIRED', 'created_at' => Clock::sql()]);
                $n++;
            }
        }
        $ip = $db->run('UPDATE quote_events SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < ?', [Clock::sql(Clock::now() - 30 * 86400)])->rowCount();
        return ['expired' => $n, 'ip_hash_cleared' => $ip];
    }
}
