import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/db/app_database.dart';
import '../../data/providers.dart';
import '../../domain/format.dart';
import 'customer_picker.dart';

class CustomerDetailScreen extends ConsumerWidget {
  const CustomerDetailScreen({super.key, required this.customerId});
  final int customerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customer = ref.watch(customerProvider(customerId));
    return customer.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(strokeWidth: 2.4))),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(padding: const EdgeInsets.all(MpSpace.x6), child: Text(friendlyError(e), style: MpText.body)),
        ),
      ),
      data: (c) {
        if (c == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const EmptyState(icon: Icons.search_off, title: 'Az ügyfél nem található', message: 'Lehet, hogy törölted.'),
          );
        }
        final projects = ref.watch(customerProjectsProvider(customerId));
        final gross = ref.watch(dashboardStatsProvider).valueOrNull?.grossByProject ?? const <int, int>{};
        return Scaffold(
          appBar: AppBar(
            actions: [
              IconButton(
                tooltip: 'Szerkesztés',
                icon: const Icon(Icons.edit_outlined),
                onPressed: () => context.push(Routes.editCustomer(customerId)),
              ),
              IconButton(
                tooltip: 'Törlés',
                icon: const Icon(Icons.delete_outline),
                onPressed: () => _delete(context, ref, c),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => context.push(Routes.newProject(customerId: customerId)),
            icon: const Icon(Icons.add),
            label: const Text('Új projekt', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(MpSpace.gutter, 0, MpSpace.gutter, 96),
            children: [
              Row(
                children: [
                  CustomerAvatar(name: c.name, size: 56),
                  const SizedBox(width: MpSpace.x4),
                  Expanded(child: Text(c.name, style: MpText.title)),
                ],
              ),
              if (c.phone != null || c.email != null) ...[
                const SizedBox(height: MpSpace.x4),
                Row(
                  children: [
                    if (c.phone != null)
                      Expanded(
                        child: MpButton(
                          label: 'Hívás',
                          icon: Icons.call_outlined,
                          expand: true,
                          onPressed: () => _launch(context, Uri(scheme: 'tel', path: _dialable(c.phone!))),
                        ),
                      ),
                    if (c.phone != null && c.email != null) const SizedBox(width: MpSpace.x3),
                    if (c.email != null)
                      Expanded(
                        child: MpButton.secondary(
                          label: 'E-mail',
                          icon: Icons.mail_outline,
                          expand: true,
                          onPressed: () => _launch(context, Uri(scheme: 'mailto', path: c.email)),
                        ),
                      ),
                  ],
                ),
              ],
              const SizedBox(height: MpSpace.x5),
              MpCard(
                child: Column(
                  children: [
                    _info(Icons.phone_outlined, c.phone),
                    _info(Icons.mail_outline, c.email),
                    _info(Icons.place_outlined, c.address),
                    _info(Icons.receipt_long_outlined, c.taxNumber == null ? null : 'Adószám: ${c.taxNumber}'),
                    _info(Icons.notes, c.notes),
                    if ([c.phone, c.email, c.address, c.taxNumber, c.notes].every((e) => e == null))
                      const Text('Nincs további adat megadva.', style: MpText.small),
                  ],
                ),
              ),
              const SectionLabel('Projektek'),
              AsyncView(
                value: projects,
                data: (list) {
                  if (list.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: MpSpace.x4),
                      child: Text('Ehhez az ügyfélhez még nincs projekt.', style: MpText.body),
                    );
                  }
                  return Column(
                    children: [
                      for (final p in list) ...[
                        MpCard(
                          onTap: () => context.push(Routes.project(p.id)),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.title, style: MpText.bodyStrong),
                                    const SizedBox(height: 4),
                                    StatusChip(p.status),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  if (gross[p.id] != null) MoneyText(gross[p.id]!),
                                  Text(Fmt.date(p.updatedAt), style: MpText.mono),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: MpSpace.x2),
                      ],
                    ],
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  /// Tárcsázható szám: szóközök, kötőjelek, zárójelek nélkül (a + megmarad).
  static String _dialable(String phone) => phone.replaceAll(RegExp(r'[^0-9+]'), '');

  Future<void> _launch(BuildContext context, Uri uri) async {
    var ok = false;
    try {
      ok = await launchUrl(uri);
    } catch (_) {
      ok = false;
    }
    if (!ok && context.mounted) {
      showInfo(context, uri.scheme == 'tel' ? 'Ezen az eszközön nem lehet hívást indítani.' : 'Nincs beállított levelezőprogram.');
    }
  }

  Widget _info(IconData icon, String? value) {
    if (value == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: MpColors.inkMuted),
          const SizedBox(width: MpSpace.x3),
          Expanded(child: SelectableText(value, style: MpText.body.copyWith(color: MpColors.ink))),
        ],
      ),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, Customer c) async {
    final repo = ref.read(customerRepoProvider);
    final count = await repo.projectCount(c.id);
    if (!context.mounted) return;
    if (count > 0) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Nem törölhető'),
          content: Text('${c.name} ügyfélhez $count projekt tartozik. Előbb azokat töröld.'),
          actions: [TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Rendben'))],
        ),
      );
      return;
    }
    final ok = await confirmDialog(context, title: 'Ügyfél törlése?', message: '${c.name} véglegesen törlődik.');
    if (!ok || !context.mounted) return;
    var deleted = false;
    await runGuarded(context, () async => deleted = await repo.deleteIfUnused(c.id));
    if (!context.mounted) return;
    if (deleted) {
      context.go(Routes.customers);
      showInfo(context, 'Ügyfél törölve');
    } else {
      showInfo(context, 'Közben projekt került az ügyfélhez, ezért nem töröltem.');
    }
  }
}
