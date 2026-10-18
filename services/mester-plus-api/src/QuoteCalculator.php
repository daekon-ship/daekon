<?php
declare(strict_types=1);

namespace MesterPlus;

if (!defined('MP_API')) {
    http_response_code(404);
    exit;
}

/**
 * A Flutter lib/domain/quote_calculator.dart + money.dart PONTOS megfelelője – csak ELLENŐRZÉSRE:
 * az app küldi a végösszeget, a szerver ugyanezzel a szabállyal újraszámolja, és eltérésnél elutasítja.
 * Közös tesztesetek: apps/mester-plus/test/fixtures/quote_totals.json (Dart és PHP teszt is ezt futtatja).
 *
 * Sorrend: soronként összeg = round(menny × (díj+anyag)); díj = round(menny × díj); anyag = különbözet →
 * részösszeg → kedvezmény/felár = round(részösszeg × %) → nettó → ÁFA = round(nettó × kulcs) → bruttó.
 * Kerekítés: half-up, negatívnál szimmetrikus. Mennyiség ezredrészben, százalék bázispontban, pénz egész Ft.
 */
final class QuoteCalculator
{
    public const QUANTITY_SCALE = 1000;
    public const PERCENT_SCALE = 10000;

    /** a*b/d half-up, túlcsordulás nélkül (bcmath/gmp nélkül is): a = qa*d + ra felbontással. */
    public static function mulDivRoundHalfUp(int $a, int $b, int $d): int
    {
        if ($d <= 0) {
            throw new \InvalidArgumentException('d');
        }
        $neg = ($a < 0) !== ($b < 0) && $a !== 0 && $b !== 0;
        $a = abs($a);
        $b = abs($b);
        $qa = intdiv($a, $d);
        $ra = $a % $d;
        $whole = $qa * $b;
        $part = $ra * $b;
        if (!is_int($whole) || !is_int($part) || !is_int(2 * $part + $d)) {
            throw new \OverflowException('Az összeg túl nagy.');
        }
        $q = $whole + intdiv(2 * $part + $d, 2 * $d);
        if (!is_int($q)) {
            throw new \OverflowException('Az összeg túl nagy.');
        }
        return $neg ? -$q : $q;
    }

    /**
     * @param list<array{quantity_milli:int,labor_unit_price_huf:int,material_unit_price_huf:int}> $lines
     * @return array{lines:list<array{labor_huf:int,material_huf:int,total_huf:int}>,labor_subtotal_huf:int,material_subtotal_huf:int,
     *               adjustment_huf:int,adjustment_percent_bp:int,net_total_huf:int,vat_huf:int,gross_total_huf:int,unpriced_line_count:int}
     */
    public static function calculate(array $lines, string $adjustmentType, int $adjustmentPercentBp, int $vatRateBp): array
    {
        if ($adjustmentPercentBp < 0 || $adjustmentPercentBp > self::PERCENT_SCALE || $vatRateBp < 0 || $vatRateBp > self::PERCENT_SCALE) {
            throw new \InvalidArgumentException('percent');
        }
        $labor = 0;
        $material = 0;
        $unpriced = 0;
        $out = [];
        foreach ($lines as $l) {
            if ($l['quantity_milli'] < 0 || $l['labor_unit_price_huf'] < 0 || $l['material_unit_price_huf'] < 0) {
                throw new \InvalidArgumentException('negative');
            }
            $total = self::mulDivRoundHalfUp($l['quantity_milli'], $l['labor_unit_price_huf'] + $l['material_unit_price_huf'], self::QUANTITY_SCALE);
            $lab = self::mulDivRoundHalfUp($l['quantity_milli'], $l['labor_unit_price_huf'], self::QUANTITY_SCALE);
            $out[] = ['labor_huf' => $lab, 'material_huf' => $total - $lab, 'total_huf' => $total];
            $labor += $lab;
            $material += $total - $lab;
            if ($l['labor_unit_price_huf'] === 0 && $l['material_unit_price_huf'] === 0) {
                $unpriced++;
            }
        }
        $subtotal = $labor + $material;
        $bp = $adjustmentType === 'none' ? 0 : $adjustmentPercentBp;
        $abs = self::mulDivRoundHalfUp($subtotal, $bp, self::PERCENT_SCALE);
        $adj = match ($adjustmentType) {
            'discount' => -$abs,
            'surcharge' => $abs,
            default => 0,
        };
        $net = $subtotal + $adj;
        $vat = self::mulDivRoundHalfUp($net, $vatRateBp, self::PERCENT_SCALE);
        return [
            'lines' => $out, 'labor_subtotal_huf' => $labor, 'material_subtotal_huf' => $material, 'adjustment_huf' => $adj,
            'adjustment_percent_bp' => $bp, 'net_total_huf' => $net, 'vat_huf' => $vat, 'gross_total_huf' => $net + $vat, 'unpriced_line_count' => $unpriced,
        ];
    }
}
