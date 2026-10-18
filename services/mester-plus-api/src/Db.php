<?php
declare(strict_types=1);

namespace MesterPlus;

use PDO;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/** Vékony PDO-réteg: kizárólag paraméterezett lekérdezések, kivétel-mód, utf8mb4. */
final class Db
{
    public PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public static function connect(Config $c): self
    {
        $host = $c->str('DB_HOST', 'localhost');
        $name = $c->str('DB_NAME');
        if ($name === '' || !preg_match('/^[A-Za-z0-9_]{1,64}$/', $name)) {
            throw new \RuntimeException('Hiányzó adatbázis-beállítás.');
        }
        $dsn = $host === 'localhost'
            ? "mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$name;charset=utf8mb4"
            : "mysql:host=$host;dbname=$name;charset=utf8mb4";
        if ($c->has('DB_SOCKET')) {
            $dsn = "mysql:unix_socket={$c->str('DB_SOCKET')};dbname=$name;charset=utf8mb4";
        }
        $pdo = new PDO($dsn, $c->str('DB_USER'), $c->str('DB_PASS'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        $pdo->exec("SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION'");
        return new self($pdo);
    }

    /** @param array<int|string,mixed> $p */
    public function run(string $sql, array $p = []): \PDOStatement
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($p);
        return $st;
    }

    /** @param array<int|string,mixed> $p @return array<string,mixed>|null */
    public function one(string $sql, array $p = []): ?array
    {
        $r = $this->run($sql, $p)->fetch();
        return $r === false ? null : $r;
    }

    /** @param array<int|string,mixed> $p @return list<array<string,mixed>> */
    public function all(string $sql, array $p = []): array
    {
        return $this->run($sql, $p)->fetchAll();
    }

    /** @param array<int|string,mixed> $p */
    public function val(string $sql, array $p = []): mixed
    {
        $v = $this->run($sql, $p)->fetchColumn();
        return $v === false ? null : $v;
    }

    /** @param array<string,mixed> $row */
    public function insert(string $table, array $row): int
    {
        if (!preg_match('/^[a-z_]{1,64}$/', $table)) {
            throw new \InvalidArgumentException('table');
        }
        $cols = array_keys($row);
        foreach ($cols as $col) {
            if (!preg_match('/^[a-z0-9_]{1,64}$/', $col)) {
                throw new \InvalidArgumentException('column');
            }
        }
        $sql = 'INSERT INTO `' . $table . '` (`' . implode('`,`', $cols) . '`) VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')';
        $this->run($sql, array_values($row));
        return (int) $this->pdo->lastInsertId();
    }

    /** @template T @param callable():T $fn @return T */
    public function tx(callable $fn): mixed
    {
        if ($this->pdo->inTransaction()) {
            return $fn();
        }
        $this->pdo->beginTransaction();
        try {
            $r = $fn();
            $this->pdo->commit();
            return $r;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }
}
