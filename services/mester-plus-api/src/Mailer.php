<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * Levél-absztrakció. Meghajtók (MP_MAIL_DRIVER):
 *   outbox (alap) – a levél a mail_outbox táblába kerül, NEM megy ki. Fejlesztés / teszt / amíg a
 *                   tulajdonos nem választ kézbesítőt. A DAEKON OS levelezési kapcsolóihoz nem nyúl.
 *   smtp          – (később) a tulajdonos által megadott SMTP-kézbesítő; amíg nincs beállítva, a sor vár.
 * Tesztkörnyezetben (MP_ENV=test/development) a küldés mindig tiltott.
 */
final class Mailer
{
    public function __construct(private App $app)
    {
    }

    public function queue(?int $accId, string $template, string $to, string $subject, string $body): void
    {
        $this->app->db()->insert('mail_outbox', [
            'account_id' => $accId, 'template' => $template, 'to_addr' => $to, 'subject' => $subject, 'body_text' => $body,
            'status' => 'QUEUED', 'created_at' => Clock::sql(),
        ]);
    }

    public function driver(): string
    {
        if (in_array($this->app->config()->env(), ['test', 'development'], true)) {
            return 'outbox';
        }
        $d = $this->app->config()->str('MP_MAIL_DRIVER', 'outbox');
        return in_array($d, ['outbox', 'smtp'], true) ? $d : 'outbox';
    }

    /** A karbantartó hívja. Kézbesítő nélkül semmit nem küld; a 7 napnál régebbi sort törli (a token úgyis lejárt). */
    public function flush(): int
    {
        $db = $this->app->db();
        $db->run('DELETE FROM mail_outbox WHERE created_at < ?', [Clock::sql(Clock::now() - 7 * 86400)]);
        return 0; // smtp-meghajtó: tulajdonosi jóváhagyás + kézbesítő után kerül be (OWNER ACTION, ld. OPERATIONS.md)
    }
}
