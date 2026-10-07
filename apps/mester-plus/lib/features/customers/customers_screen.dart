import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/providers.dart';
import 'customer_picker.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customers = ref.watch(customersProvider);
    final q = _search.text.trim().toLowerCase();

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(Routes.newCustomer),
        icon: const Icon(Icons.person_add_alt),
        label: const Text('Új ügyfél', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const PageHeader(title: 'Ügyfelek'),
            Padding(
              padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, MpSpace.x2),
              child: TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  hintText: 'Keresés',
                  prefixIcon: Icon(Icons.search, size: 20),
                ),
              ),
            ),
            Expanded(
              child: AsyncView(
                value: customers,
                data: (all) {
                  if (all.isEmpty) {
                    return const EmptyState(
                      icon: Icons.people_alt_outlined,
                      title: 'Nincs még ügyfél',
                      message: 'Az ügyfeleid itt gyűlnek, a projektjeikkel együtt.',
                    );
                  }
                  final list = all
                      .where((c) =>
                          q.isEmpty ||
                          c.name.toLowerCase().contains(q) ||
                          (c.phone ?? '').contains(q) ||
                          (c.address ?? '').toLowerCase().contains(q))
                      .toList();
                  if (list.isEmpty) return const Center(child: Text('Nincs találat', style: MpText.body));
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const SizedBox(height: MpSpace.x2),
                    itemBuilder: (_, i) {
                      final c = list[i];
                      return MpCard(
                        onTap: () => context.push(Routes.customer(c.id)),
                        padding: const EdgeInsets.symmetric(horizontal: MpSpace.x4, vertical: MpSpace.x3),
                        child: Row(
                          children: [
                            CustomerAvatar(name: c.name),
                            const SizedBox(width: MpSpace.x3),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.name, style: MpText.bodyStrong),
                                  if (c.phone != null || c.address != null)
                                    Text(
                                      [c.phone, c.address].whereType<String>().join(' · '),
                                      style: MpText.small,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right, color: MpColors.inkFaint),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
