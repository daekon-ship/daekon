<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/** Felhasználónak szóló hiba: magyar üzenet, gépi kód, HTTP-állapot. Belső részlet soha nem kerül bele. */
final class ApiError extends \RuntimeException
{
    /** @param array<string,mixed> $extra */
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message, public readonly array $extra = [])
    {
        parent::__construct($message);
    }
}

final class Request
{
    public string $requestId;
    public ?string $correlationId = null;
    /** @var array<string,string> */
    public array $params = [];
    public ?array $auth = null;
    public string $routeName = '-';
    public float $started;
    /** @var resource|null */
    private $bodyStream = null;
    private ?string $body = null;

    /**
     * @param array<string,string> $headers kisbetűs nevek
     * @param array<string,string> $query
     */
    public function __construct(
        public string $method,
        public string $path,
        public array $headers = [],
        public array $query = [],
        ?string $body = null,
        public string $ip = '0.0.0.0',
        public bool $https = true,
        public string $host = '',
        public array $cookies = [],
    ) {
        $this->body = $body;
        $this->requestId = bin2hex(random_bytes(8));
        $cid = $headers['x-request-id'] ?? '';
        if (preg_match('/^[A-Za-z0-9._-]{8,64}$/', $cid)) {
            $this->correlationId = $cid;
        }
        $this->started = microtime(true);
    }

    public static function fromGlobals(): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string) $v;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['content-length'] = (string) $_SERVER['CONTENT_LENGTH'];
        }
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = (string) (parse_url($uri, PHP_URL_PATH) ?? '/');
        $query = [];
        foreach ($_GET as $k => $v) {
            if (is_string($k) && is_string($v)) {
                $query[$k] = $v;
            }
        }
        $cookies = [];
        foreach ($_COOKIE as $k => $v) {
            if (is_string($k) && is_string($v)) {
                $cookies[$k] = $v;
            }
        }
        // Kliens-IP: csak a közvetlen kapcsolat címe. Proxy nincs a VPS előtt, ezért az
        // X-Forwarded-For fejlécet SOHA nem vesszük figyelembe (bárki hamisíthatná).
        $r = new self(
            strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            $path,
            $headers,
            $query,
            null,
            (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'),
            (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off'),
            strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')),
            $cookies,
        );
        $r->bodyStream = null;
        return $r;
    }

    public function header(string $name): string
    {
        return $this->headers[strtolower($name)] ?? '';
    }

    /** A törzs szövegként, méretkorláttal. */
    public function rawBody(int $max = 1048576): string
    {
        if ($this->body !== null) {
            if (strlen($this->body) > $max) {
                throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'A kérés túl nagy.');
            }
            return $this->body;
        }
        $len = (int) $this->header('content-length');
        if ($len > $max) {
            throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'A kérés túl nagy.');
        }
        $in = fopen('php://input', 'rb');
        $data = $in === false ? '' : (string) stream_get_contents($in, $max + 1);
        if ($in !== false) {
            fclose($in);
        }
        if (strlen($data) > $max) {
            throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'A kérés túl nagy.');
        }
        $this->body = $data;
        return $data;
    }

    /** A törzs folyamként (nagy feltöltéshez). @return resource */
    public function bodyStream()
    {
        if ($this->body !== null) {
            $s = fopen('php://memory', 'w+b');
            fwrite($s, $this->body);
            rewind($s);
            return $s;
        }
        $s = fopen('php://input', 'rb');
        if ($s === false) {
            throw new ApiError(400, 'BAD_REQUEST', 'Hiányzó adat.');
        }
        return $s;
    }

    /** @return array<string,mixed> */
    public function json(int $max = 1048576): array
    {
        $ct = strtolower($this->header('content-type'));
        if (!str_starts_with($ct, 'application/json')) {
            throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'A kérés formátuma nem megfelelő.');
        }
        $raw = $this->rawBody($max);
        try {
            $d = json_decode($raw, true, 32, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
        } catch (\JsonException) {
            throw new ApiError(400, 'INVALID_JSON', 'Hibás kérés.');
        }
        if (!is_array($d) || array_is_list($d) && $d !== []) {
            throw new ApiError(400, 'INVALID_JSON', 'Hibás kérés.');
        }
        return $d;
    }

    /** Űrlap-mezők (publikus oldalak POST-ja). @return array<string,string> */
    public function form(): array
    {
        $raw = $this->rawBody(16384);
        parse_str($raw, $out);
        $r = [];
        foreach ($out as $k => $v) {
            if (is_string($k) && is_string($v)) {
                $r[$k] = $v;
            }
        }
        return $r;
    }
}

final class Response
{
    /** @var array<string,string> */
    public array $headers = [];
    /** @var resource|null */
    public $stream = null;

    public function __construct(public int $status = 200, public string $body = '', array $headers = [])
    {
        $this->headers = $headers;
    }

    /** @param array<string,mixed>|list<mixed> $data */
    public static function json(array $data, int $status = 200): self
    {
        $body = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        return new self($status, $body, ['Content-Type' => 'application/json; charset=utf-8']);
    }

    public static function html(string $html, int $status = 200): self
    {
        return new self($status, $html, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    public static function error(ApiError $e, string $requestId): self
    {
        $err = ['code' => $e->errorCode, 'message' => $e->getMessage(), 'request_id' => $requestId];
        foreach ($e->extra as $k => $v) {
            $err[$k] = $v;
        }
        return self::json(['error' => $err], $e->status);
    }

    public function send(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $k => $v) {
            header($k . ': ' . str_replace(["\r", "\n"], '', $v));
        }
        if ($this->stream !== null) {
            while (!feof($this->stream)) {
                $chunk = fread($this->stream, 65536);
                if ($chunk === false) {
                    break;
                }
                echo $chunk;
            }
            fclose($this->stream);
            return;
        }
        echo $this->body;
    }
}
