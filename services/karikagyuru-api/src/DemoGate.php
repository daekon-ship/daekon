<?php
declare(strict_types=1);

/**
 * Jelszóval védett bemutató – a TELJES oldal (weboldal + API) előtti kapu (V5.6).
 *
 * - Külön belépési jelszó (nem az admin jelszava): $KG_DATA/demo-kapu.json – bcrypt-lenyomat és titkos kulcs, 0600.
 * - Sikeres belépés után aláírt, lejáró süti (kg_demo_kapu, HttpOnly, SameSite=Lax, HTTPS-en Secure) – 12 óra.
 * - Hibás jelszó: 15 perc alatt 5 próbálkozás után zárolás (IP-cím helyett napi sózott lenyomat, ahogy az admin belépésnél).
 * - Belépés nélkül: az oldal helyett belépő űrlap (401), az API-ra 401 JSON. Az admin felület ezen felül saját jelszót kér.
 */
final class DemoGate
{
    private const COOKIE = 'kg_demo_kapu';
    private const TTL = 12 * 3600;

    public function __construct(private string $data) {}

    private function file(): string { return $this->data . '/demo-kapu.json'; }

    public function installed(): bool { return is_file($this->file()); }

    public static function install(string $data, string $password): void
    {
        if (strlen($password) < 10) throw new InvalidArgumentException('A bemutató jelszava legalább 10 karakter legyen.');
        $f = $data . '/demo-kapu.json';
        file_put_contents($f, json_encode(['hash' => password_hash($password, PASSWORD_DEFAULT), 'secret' => bin2hex(random_bytes(32)), 'created' => gmdate('c')]));
        chmod($f, 0600);
    }

    private function cfg(): array { return json_decode((string) file_get_contents($this->file()), true) ?: []; }

    private function sign(int $exp): string { return $exp . '.' . hash_hmac('sha256', 'kg-demo|' . $exp, (string) $this->cfg()['secret']); }

    private function valid(): bool
    {
        $c = (string) ($_COOKIE[self::COOKIE] ?? '');
        if (!preg_match('/^(\d{10})\.[a-f0-9]{64}$/', $c, $m)) return false;
        return (int) $m[1] > time() && hash_equals($this->sign((int) $m[1]), $c);
    }

    private function secure(): bool { return (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') || getenv('KG_FORCE_SECURE') === '1'; }

    private function setCookie(string $v, int $exp, string $base): void
    {
        setcookie(self::COOKIE, $v, ['expires' => $exp, 'path' => $base, 'httponly' => true, 'samesite' => 'Lax', 'secure' => $this->secure()]);
    }

    /**
     * Igaz, ha a kérés továbbmehet (érvényes belépés). Egyébként a kapu maga válaszol.
     * $path: a bemutató gyökeréhez viszonyított útvonal ("/", "/api/state", "/kapu" …); $base: a bemutató URL-előtagja ("/" vagy "/bemutato/").
     */
    public function handle(App $app, string $path, string $base): bool
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($path === '/kapu/kilepes') { $this->setCookie('', time() - 3600, $base); header('Location: ' . $base, true, 303); return false; }
        if ($path === '/kapu' && $method === 'POST') {
            if ($app->gateLocked()) { $this->form($base, 'Túl sok hibás próbálkozás. Próbálja újra 15 perc múlva.', 429); return false; }
            $pw = (string) ($_POST['jelszo'] ?? '');
            if ($pw !== '' && password_verify($pw, (string) $this->cfg()['hash'])) {
                $exp = time() + self::TTL;
                $this->setCookie($this->sign($exp), $exp, $base);
                header('Location: ' . $base, true, 303);
                return false;
            }
            $app->gateFailed();
            $this->form($base, 'Hibás jelszó.', 401);
            return false;
        }
        if ($this->valid()) return true;
        if (str_starts_with($path, '/api/') || $path === '/api') {
            http_response_code(401); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
            echo json_encode(['error' => 'A bemutató jelszóval védett. Lépjen be újra.'], JSON_UNESCAPED_UNICODE);
            return false;
        }
        $this->form($base, '', 401);
        return false;
    }

    private function form(string $base, string $err, int $status): void
    {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-store');
        $e = htmlspecialchars($err, ENT_QUOTES);
        $b = htmlspecialchars($base, ENT_QUOTES);
        echo <<<HTML
<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Zárt bemutató – Karikagyuru.com</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F2F8FA;color:#15262D;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}
main{width:100%;max-width:380px;background:#fff;border:1px solid #CDE8F0;border-radius:14px;padding:28px}
h1{font:600 1.25rem/1.3 Georgia,"Libre Baskerville",serif;margin:0 0 .4rem}p{margin:.3rem 0 1rem;color:#4F626B;font-size:.95rem}
label{display:block;font-weight:600;font-size:.9rem;margin-bottom:.35rem}input{width:100%;font:inherit;padding:.7rem .8rem;border:1px solid #8FCFE1;border-radius:8px}
button{margin-top:1rem;width:100%;font:inherit;font-weight:600;padding:.75rem;border:0;border-radius:8px;background:#15262D;color:#fff;cursor:pointer}
ul{margin:0 0 1rem;padding-left:1.1rem;color:#4F626B;font-size:.92rem}li{margin:.2rem 0}.err{color:#9a2b1f;font-weight:600}.fine{font-size:.82rem;margin-top:1rem}
</style></head><body><main>
<h1>Karikagyuru.com – zárt bemutató</h1>
<p>Ez az új weboldal és kezelőfelület kipróbálható bemutatója.</p>
<ul data-kapupontok><li>Ez még <b>bemutató</b>, nem az éles oldal.</li><li>Az árak <b>szemléltetők</b>, nem az ötvös végleges árai.</li><li>Az éles karikagyuru.com-on <b>semmi nem változik</b>.</li><li>A kipróbált változtatások <b>megmaradnak</b>.</li><li>Az ajánlatkérések nem kerülnek valódi ügyfelekhez, e-mail nem megy ki.</li></ul>
<form method="post" action="{$b}kapu" data-kapu>
<label for="jelszo">Bemutató jelszava</label><input id="jelszo" name="jelszo" type="password" autocomplete="current-password" required autofocus>
<p class="err" role="alert" data-kapuerr>{$e}</p>
<button type="submit">Belépés</button></form>
<p class="fine">A jelszót a DAEKON-tól kapta. A kezelőfelülethez ezen felül külön admin jelszó kell.</p>
</main></body></html>
HTML;
    }
}
