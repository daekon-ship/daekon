import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/providers.dart';
import '../../domain/enums.dart';

class PriceListScreen extends ConsumerStatefulWidget {
  const PriceListScreen({super.key});

  @override
  ConsumerState<PriceListScreen> createState() => _PriceListScreenState();
}

class _PriceListScreenState extends ConsumerState<PriceListScreen> {
  TradeCategory? _category;

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(priceItemsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(Routes.newPriceItem),
        icon: const Icon(Icons.add),
        label: const Text('Új tétel', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: SafeArea(
        bottom: false,
        child: AsyncView(
          value: items,
          data: (all) {
            final unpriced = all.where((i) => i.laborUnitPriceHuf == 0 && i.materialUnitPriceHuf == 0).length;
            final present = {for (final i in all) i.category};
            final list = _category == null ? all : all.where((i) => i.category == _category).toList();
            return CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: PageHeader(
                    title: 'Árlista',
                    subtitle: '${all.length} tétel · saját áraid, nettóban',
                  ),
                ),
                if (unpriced > 0)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 0),
                      child: MpCard(
                        color: MpColors.accentSoft,
                        borderColor: MpColors.accentSoft,
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, color: MpColors.warning),
                            const SizedBox(width: MpSpace.x3),
                            Expanded(
                              child: Text(
                                '$unpriced tételnek még nincs ára. Írd be a saját áraidat, '
                                'és az új ajánlatok már ezekkel számolnak.',
                                style: MpText.small.copyWith(color: MpColors.onAccent),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 52,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter, vertical: MpSpace.x2),
                      children: [
                        _chip('Összes', _category == null, () => setState(() => _category = null)),
                        for (final c in TradeCategory.values)
                          if (present.contains(c))
                            _chip(c.label, _category == c, () => setState(() => _category = c)),
                      ],
                    ),
                  ),
                ),
                if (list.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.sell_outlined,
                      title: 'Üres árlista',
                      message: 'Vedd fel a gyakori munkáidat a saját áraiddal.',
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
                    sliver: SliverList.separated(
                      itemCount: list.length,
                      separatorBuilder: (_, _) => const SizedBox(height: MpSpace.x2),
                      itemBuilder: (_, i) {
                        final it = list[i];
                        final priced = it.laborUnitPriceHuf > 0 || it.materialUnitPriceHuf > 0;
                        return MpCard(
                          onTap: () => context.push(Routes.priceItem(it.id)),
                          padding: const EdgeInsets.symmetric(horizontal: MpSpace.x4, vertical: MpSpace.x3),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(it.name, style: MpText.bodyStrong),
                                    const SizedBox(height: 2),
                                    Text(it.category.label, style: MpText.small),
                                  ],
                                ),
                              ),
                              const SizedBox(width: MpSpace.x3),
                              if (priced)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    MoneyText(it.laborUnitPriceHuf + it.materialUnitPriceHuf),
                                    Text('/ ${it.unit.symbol}', style: MpText.mono),
                                  ],
                                )
                              else
                                Pill('Ár megadása · ${it.unit.symbol}', bg: MpColors.warningSoft, fg: MpColors.warning),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: MpSpace.x2),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        showCheckmark: false,
        labelStyle: MpText.small.copyWith(
          fontWeight: FontWeight.w600,
          color: selected ? MpColors.onBrand : MpColors.inkSoft,
        ),
        selectedColor: MpColors.brand,
        backgroundColor: MpColors.surface,
        side: BorderSide(color: selected ? MpColors.brand : MpColors.line),
        shape: const StadiumBorder(),
      ),
    );
  }
}
