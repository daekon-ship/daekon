<?php
// Mester+ Cloud – 0002: csomagok (FREE / PRO / TEAM). Az árak TERVEZETEK (DRAFT): élesíteni csak a
// tulajdonos jóváhagyása után szabad (pricing_status = APPROVED). Az ár egyetlen forrása ez a tábla.
declare(strict_types=1);
if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

return [
    "INSERT INTO plans (code, name, pricing_status, price_huf_month, price_huf_year, trial_days, backup_quota_bytes,
        backup_max_versions, backup_retention_days, max_devices, features, play_product_ids, updated_at) VALUES
     ('free', 'Mester+ Offline', 'APPROVED', 0, 0, 0, 0, 0, 0, 1, '', '', UTC_TIMESTAMP()),
     ('pro', 'Mester+ Pro', 'DRAFT', 4990, 49900, 14, 524288000, 30, 30, 3,
        'cloud_backup,cloud_restore,online_quotes,multiple_devices', 'mester_plus_pro_monthly,mester_plus_pro_yearly', UTC_TIMESTAMP()),
     ('team', 'Mester+ Team', 'DRAFT', NULL, NULL, 0, 2147483648, 60, 60, 10,
        'cloud_backup,cloud_restore,online_quotes,multiple_devices,team', '', UTC_TIMESTAMP())",
];
