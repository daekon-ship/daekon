<?php
// Mester+ Cloud – 0001: alapséma (fiók, munkaterület, eszköz, munkamenet, csomag, előfizetés,
// jogosultság, felhőmentés, online ajánlat, webhook, idempotencia, audit, rate limit, metrika).
// Minden tábla InnoDB + utf8mb4; minden felhőadat munkaterülethez (workspace) kötött.
// A webszerverről nem futtatható (404) – csak a migrációs CLI tölti be.
declare(strict_types=1);
if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

$t = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

return [
    "CREATE TABLE accounts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(26) NOT NULL,
        email VARCHAR(254) NULL,
        email_hash BINARY(32) NULL,
        email_verified_at DATETIME NULL,
        password_hash VARCHAR(255) NULL,
        status ENUM('ACTIVE','SUSPENDED','DELETION_PENDING','DELETED') NOT NULL DEFAULT 'ACTIVE',
        role ENUM('user','admin') NOT NULL DEFAULT 'user',
        failed_logins INT UNSIGNED NOT NULL DEFAULT 0,
        locked_until DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        last_login_at DATETIME NULL,
        deletion_requested_at DATETIME NULL,
        deleted_at DATETIME NULL,
        UNIQUE KEY uq_accounts_public (public_id),
        UNIQUE KEY uq_accounts_email (email),
        KEY ix_accounts_status (status)
    ) $t",

    "CREATE TABLE workspaces (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(26) NOT NULL,
        name VARCHAR(120) NOT NULL,
        owner_account_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL,
        deleted_at DATETIME NULL,
        UNIQUE KEY uq_ws_public (public_id),
        KEY ix_ws_owner (owner_account_id),
        CONSTRAINT fk_ws_owner FOREIGN KEY (owner_account_id) REFERENCES accounts(id)
    ) $t",

    "CREATE TABLE workspace_members (
        workspace_id BIGINT UNSIGNED NOT NULL,
        account_id BIGINT UNSIGNED NOT NULL,
        role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
        created_at DATETIME NOT NULL,
        PRIMARY KEY (workspace_id, account_id),
        KEY ix_wm_account (account_id),
        CONSTRAINT fk_wm_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_wm_acc FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    ) $t",

    "CREATE TABLE devices (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(26) NOT NULL,
        workspace_id BIGINT UNSIGNED NOT NULL,
        account_id BIGINT UNSIGNED NOT NULL,
        device_uuid CHAR(36) NOT NULL,
        platform VARCHAR(16) NOT NULL,
        app_version VARCHAR(32) NOT NULL,
        device_name VARCHAR(80) NOT NULL,
        created_at DATETIME NOT NULL,
        last_seen_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        UNIQUE KEY uq_dev_public (public_id),
        UNIQUE KEY uq_dev_account_uuid (account_id, device_uuid),
        KEY ix_dev_ws (workspace_id),
        CONSTRAINT fk_dev_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_dev_acc FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    ) $t",

    // Egy eszközön egy élő munkamenet. Az access token csak HMAC-kivonatként tárolódik.
    "CREATE TABLE sessions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(26) NOT NULL,
        account_id BIGINT UNSIGNED NOT NULL,
        workspace_id BIGINT UNSIGNED NOT NULL,
        device_id BIGINT UNSIGNED NOT NULL,
        access_hash BINARY(32) NOT NULL,
        access_expires_at DATETIME NOT NULL,
        refresh_expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        last_used_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        revoke_reason VARCHAR(32) NULL,
        UNIQUE KEY uq_sess_public (public_id),
        UNIQUE KEY uq_sess_access (access_hash),
        KEY ix_sess_account (account_id, revoked_at),
        KEY ix_sess_device (device_id),
        CONSTRAINT fk_sess_acc FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_sess_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_sess_dev FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    ) $t",

    // Refresh token rotáció: minden token egyszer használható; ismételt használat = lopás gyanú → a munkamenet visszavonva.
    "CREATE TABLE refresh_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL,
        token_hash BINARY(32) NOT NULL,
        created_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        UNIQUE KEY uq_rt_hash (token_hash),
        KEY ix_rt_session (session_id),
        CONSTRAINT fk_rt_sess FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    ) $t",

    "CREATE TABLE email_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        account_id BIGINT UNSIGNED NOT NULL,
        purpose ENUM('verify','reset') NOT NULL,
        token_hash BINARY(32) NOT NULL,
        created_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        UNIQUE KEY uq_et_hash (token_hash),
        KEY ix_et_account (account_id, purpose),
        CONSTRAINT fk_et_acc FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    ) $t",

    // Kimenő levelek sora. Alapból NEM küld (MP_MAIL_DRIVER=outbox): a levél csak itt áll, amíg
    // a tulajdonos be nem kapcsol egy kézbesítőt. A törzs a tokent tartalmazza, ezért rövid megőrzés (7 nap).
    "CREATE TABLE mail_outbox (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        account_id BIGINT UNSIGNED NULL,
        template VARCHAR(32) NOT NULL,
        to_addr VARCHAR(254) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        body_text TEXT NOT NULL,
        status ENUM('QUEUED','SENT','FAILED','SUPPRESSED') NOT NULL DEFAULT 'QUEUED',
        attempts INT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        sent_at DATETIME NULL,
        KEY ix_mail_status (status, created_at)
    ) $t",

    "CREATE TABLE plans (
        code VARCHAR(16) PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        pricing_status ENUM('DRAFT','APPROVED') NOT NULL DEFAULT 'DRAFT',
        price_huf_month INT UNSIGNED NULL,
        price_huf_year INT UNSIGNED NULL,
        trial_days INT UNSIGNED NOT NULL DEFAULT 0,
        backup_quota_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
        backup_max_versions INT UNSIGNED NOT NULL DEFAULT 0,
        backup_retention_days INT UNSIGNED NOT NULL DEFAULT 0,
        max_devices INT UNSIGNED NOT NULL DEFAULT 1,
        features VARCHAR(500) NOT NULL DEFAULT '',
        play_product_ids VARCHAR(300) NOT NULL DEFAULT '',
        updated_at DATETIME NOT NULL
    ) $t",

    // Előfizetés-állapot (NEM keverendő a fiók-állapottal).
    "CREATE TABLE subscriptions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        workspace_id BIGINT UNSIGNED NOT NULL,
        plan_code VARCHAR(16) NOT NULL,
        status ENUM('TRIAL','ACTIVE','GRACE','PAST_DUE','CANCELLED','EXPIRED') NOT NULL,
        provider ENUM('manual','sandbox','google_play') NOT NULL,
        provider_ref_hash BINARY(32) NULL,
        product_id VARCHAR(100) NULL,
        started_at DATETIME NOT NULL,
        current_period_end DATETIME NULL,
        grace_until DATETIME NULL,
        cancelled_at DATETIME NULL,
        auto_renewing TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uq_sub_provider_ref (provider, provider_ref_hash),
        KEY ix_sub_ws (workspace_id, status),
        CONSTRAINT fk_sub_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_sub_plan FOREIGN KEY (plan_code) REFERENCES plans(code)
    ) $t",

    // Pénzügyi jellegű esemény: fióktörléskor is megmarad (a munkaterület-hivatkozás NULL-ra áll).
    "CREATE TABLE subscription_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        subscription_id BIGINT UNSIGNED NULL,
        workspace_id BIGINT UNSIGNED NULL,
        type VARCHAR(40) NOT NULL,
        from_status VARCHAR(16) NULL,
        to_status VARCHAR(16) NULL,
        provider VARCHAR(16) NOT NULL,
        provider_event_id VARCHAR(120) NULL,
        created_at DATETIME NOT NULL,
        KEY ix_se_sub (subscription_id),
        KEY ix_se_created (created_at),
        CONSTRAINT fk_se_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
        CONSTRAINT fk_se_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
    ) $t",

    // Kézi / béta jogosultság a csomagon felül (pl. teszt-szakiknak). A csomag jogosultságai a plans.features-ből jönnek.
    "CREATE TABLE entitlements (
        workspace_id BIGINT UNSIGNED NOT NULL,
        feature VARCHAR(40) NOT NULL,
        source VARCHAR(40) NOT NULL,
        valid_until DATETIME NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (workspace_id, feature),
        CONSTRAINT fk_ent_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    ) $t",

    // Mentési kulcs (BK): munkaterületenként véletlen 32 bájt, a szerver mesterkulcsával (KEK) burkolva.
    // A mentés-blobot a telefon titkosítja ezzel a kulccsal; a szerver tárolója soha nem lát nyílt adatot.
    "CREATE TABLE backup_keys (
        workspace_id BIGINT UNSIGNED NOT NULL,
        key_version INT UNSIGNED NOT NULL,
        kek_version INT UNSIGNED NOT NULL,
        wrapped_key VARBINARY(128) NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (workspace_id, key_version),
        CONSTRAINT fk_bk_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    ) $t",

    // Egy sor = egy mentés-verzió (külön backup_versions tábla nem kell).
    "CREATE TABLE cloud_backups (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(26) NOT NULL,
        workspace_id BIGINT UNSIGNED NOT NULL,
        device_id BIGINT UNSIGNED NULL,
        app_version VARCHAR(32) NOT NULL,
        backup_format_version INT UNSIGNED NOT NULL,
        encryption_version INT UNSIGNED NOT NULL,
        key_version INT UNSIGNED NOT NULL,
        size_bytes BIGINT UNSIGNED NOT NULL,
        checksum_sha256 CHAR(64) NOT NULL,
        status ENUM('UPLOADING','VERIFYING','READY','FAILED','DELETED') NOT NULL,
        storage_key VARCHAR(80) NOT NULL,
        failed_reason VARCHAR(64) NULL,
        created_at DATETIME NOT NULL,
        uploaded_at DATETIME NULL,
        deleted_at DATETIME NULL,
        UNIQUE KEY uq_cb_public (public_id),
        KEY ix_cb_ws_status (workspace_id, status, created_at),
        CONSTRAINT fk_cb_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_cb_dev FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    ) $t",

    // Online ajánlat: megváltoztathatatlan pillanatkép + publikus token (csak HMAC-kivonat tárolva).
    "CREATE TABLE quote_shares (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(26) NOT NULL,
        workspace_id BIGINT UNSIGNED NOT NULL,
        device_id BIGINT UNSIGNED NULL,
        quote_number VARCHAR(40) NOT NULL,
        quote_version INT UNSIGNED NOT NULL,
        token_hash BINARY(32) NOT NULL,
        snapshot MEDIUMTEXT NOT NULL,
        snapshot_hash CHAR(64) NOT NULL,
        gross_total_huf BIGINT NOT NULL,
        valid_until DATE NOT NULL,
        status ENUM('ACTIVE','ACCEPTED','DECLINED','EXPIRED','REVOKED') NOT NULL DEFAULT 'ACTIVE',
        first_opened_at DATETIME NULL,
        last_opened_at DATETIME NULL,
        open_count INT UNSIGNED NOT NULL DEFAULT 0,
        decided_at DATETIME NULL,
        revoked_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        UNIQUE KEY uq_qs_public (public_id),
        UNIQUE KEY uq_qs_token (token_hash),
        UNIQUE KEY uq_qs_number_version (workspace_id, quote_number, quote_version),
        KEY ix_qs_ws (workspace_id, status),
        KEY ix_qs_valid (status, valid_until),
        CONSTRAINT fk_qs_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_qs_dev FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    ) $t",

    "CREATE TABLE quote_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        quote_share_id BIGINT UNSIGNED NOT NULL,
        type ENUM('CREATED','OPENED','ACCEPTED','DECLINED','EXPIRED','REVOKED') NOT NULL,
        created_at DATETIME NOT NULL,
        ip_hash BINARY(32) NULL,
        KEY ix_qe_share (quote_share_id, created_at),
        CONSTRAINT fk_qe_qs FOREIGN KEY (quote_share_id) REFERENCES quote_shares(id) ON DELETE CASCADE
    ) $t",

    "CREATE TABLE webhook_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(16) NOT NULL,
        event_id VARCHAR(120) NOT NULL,
        event_type VARCHAR(60) NOT NULL,
        payload_hash CHAR(64) NOT NULL,
        status ENUM('RECEIVED','PROCESSED','FAILED','IGNORED') NOT NULL,
        attempts INT UNSIGNED NOT NULL DEFAULT 1,
        error VARCHAR(200) NULL,
        received_at DATETIME NOT NULL,
        processed_at DATETIME NULL,
        UNIQUE KEY uq_wh_event (provider, event_id),
        KEY ix_wh_status (status, received_at)
    ) $t",

    "CREATE TABLE idempotency_keys (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        scope VARCHAR(80) NOT NULL,
        idem_key VARCHAR(100) NOT NULL,
        route VARCHAR(80) NOT NULL,
        request_hash CHAR(64) NOT NULL,
        status ENUM('PENDING','DONE') NOT NULL,
        response_status SMALLINT UNSIGNED NULL,
        response_body MEDIUMTEXT NULL,
        created_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        UNIQUE KEY uq_idem (scope, route, idem_key),
        KEY ix_idem_exp (expires_at)
    ) $t",

    // Biztonsági audit. Nincs benne jelszó, token, mentés- vagy ajánlat-tartalom; az IP csak HMAC-kivonat.
    "CREATE TABLE audit_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME NOT NULL,
        event VARCHAR(40) NOT NULL,
        account_id BIGINT UNSIGNED NULL,
        workspace_id BIGINT UNSIGNED NULL,
        target VARCHAR(64) NULL,
        ip_hash BINARY(32) NULL,
        request_id CHAR(16) NULL,
        meta VARCHAR(500) NULL,
        KEY ix_audit_created (created_at),
        KEY ix_audit_account (account_id, created_at),
        KEY ix_audit_event (event, created_at)
    ) $t",

    "CREATE TABLE rate_limit_state (
        bucket VARCHAR(190) NOT NULL,
        window_start INT UNSIGNED NOT NULL,
        hits INT UNSIGNED NOT NULL,
        PRIMARY KEY (bucket, window_start),
        KEY ix_rl_window (window_start)
    ) $t",

    // Óránkénti számlálók (5xx, hitelesítési hiba, feltöltési hiba, tárhely-hiba, …) – személyes adat nélkül.
    "CREATE TABLE metrics_hourly (
        hour INT UNSIGNED NOT NULL,
        name VARCHAR(40) NOT NULL,
        value BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (hour, name)
    ) $t",
];
