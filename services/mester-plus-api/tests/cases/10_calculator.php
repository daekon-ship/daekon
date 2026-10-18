<?php
declare(strict_types=1);

use MesterPlus\QuoteCalculator;

return [
    'közös fixture-ök: a PHP kalkulátor forintra egyezik (Dart-tal azonos esetek)' => function () {
        $fx = json_decode((string) file_get_contents(dirname(__DIR__, 4) . '/apps/mester-plus/test/fixtures/quote_totals.json'), true);
        ok(is_array($fx) && count($fx['cases']) >= 50, 'legalább 50 közös eset');
        foreach ($fx['cases'] as $c) {
            $in = $c['input'];
            $t = QuoteCalculator::calculate($in['lines'], $in['adjustment_type'], $in['adjustment_percent_bp'], $in['vat_rate_bp']);
            $e = $c['expected'];
            foreach (['labor_subtotal_huf', 'material_subtotal_huf', 'adjustment_huf', 'net_total_huf', 'vat_huf', 'gross_total_huf'] as $k) {
                eq($t[$k], $e[$k], "{$c['name']}: $k");
            }
            foreach ($e['lines'] as $i => $l) {
                eq($t['lines'][$i]['total_huf'], $l['total_huf'], "{$c['name']}: sor $i összeg");
                eq($t['lines'][$i]['labor_huf'], $l['labor_huf'], "{$c['name']}: sor $i díj");
            }
        }
    },
    'half-up kerekítés, negatív szimmetrikus, túlcsordulás nélkül' => function () {
        eq(QuoteCalculator::mulDivRoundHalfUp(5, 1, 2), 3, '2,5 → 3');
        eq(QuoteCalculator::mulDivRoundHalfUp(-5, 1, 2), -3, '-2,5 → -3');
        eq(QuoteCalculator::mulDivRoundHalfUp(4, 1, 2), 2, '2 → 2');
        eq(QuoteCalculator::mulDivRoundHalfUp(600_000_000_000_000, 10000, 10000), 600_000_000_000_000, '6e14 × 100% nem csordul túl');
        $threw = false;
        try {
            QuoteCalculator::mulDivRoundHalfUp(PHP_INT_MAX, PHP_INT_MAX, 1);
        } catch (OverflowException) {
            $threw = true;
        }
        ok($threw, 'túl nagy összeg: kivétel, nem csendes hibás szám');
    },
];
