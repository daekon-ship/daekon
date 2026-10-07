import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/providers.dart';
import '../../data/repositories.dart';
import 'project_card.dart';

enum _Filter {
  all('Összes'),
  open('Nyitott'),
  won('Megnyert'),
  closed('Lezárt');

  const _Filter(this.label);
  final String label;

  bool matches(ProjectWithCustomer p) => switch (this) {
        _Filter.all => true,
        _Filter.open => p.project.status.isPipeline,
        _Filter.won => p.project.status.isWon,
        _Filter.closed => !p.project.status.isActive,
      };
}

class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen> {
  _Filter _filter = _Filter.all;
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  /// Keresés a projekt nevében, az ügyfél nevében, a helyszínben és az ajánlatszámban.
  bool _matchesQuery(ProjectWithCustomer p, String q) {
    if (q.isEmpty) return true;
    final hay = [
      p.project.title,
      p.customer.name,
      p.project.siteAddress ?? '',
      p.project.quoteNumber ?? '',
    ].join(' ').toLowerCase();
    return q.split(RegExp(r'\s+')).every(hay.contains);
  }

  @override
  Widget build(BuildContext context) {
    final projects = ref.watch(projectsProvider);
    final gross = ref.watch(dashboardStatsProvider).valueOrNull?.grossByProject ?? const <int, int>{};

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(Routes.newProject()),
        icon: const Icon(Icons.add),
        label: const Text('Új projekt', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const PageHeader(title: 'Projektek'),
            Padding(
              padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 0),
              child: TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Keresés: projekt, ügyfél, cím, ajánlatszám',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  suffixIcon: _search.text.isEmpty
                      ? null
                      : IconButton(
                          tooltip: 'Törlés',
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () => setState(_search.clear),
                        ),
                ),
              ),
            ),
            SizedBox(
              height: 52,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: MpSpace.gutter, vertical: MpSpace.x2),
                children: [
                  for (final f in _Filter.values) ...[
                    ChoiceChip(
                      label: Text(f.label),
                      selected: _filter == f,
                      onSelected: (_) => setState(() => _filter = f),
                      showCheckmark: false,
                      labelStyle: MpText.small.copyWith(
                        fontWeight: FontWeight.w600,
                        color: _filter == f ? MpColors.onBrand : MpColors.inkSoft,
                      ),
                      selectedColor: MpColors.brand,
                      backgroundColor: MpColors.surface,
                      side: BorderSide(color: _filter == f ? MpColors.brand : MpColors.line),
                      shape: const StadiumBorder(),
                    ),
                    const SizedBox(width: MpSpace.x2),
                  ],
                ],
              ),
            ),
            Expanded(
              child: AsyncView(
                value: projects,
                data: (all) {
                  final q = _search.text.trim().toLowerCase();
                  final list = all.where((p) => _filter.matches(p) && _matchesQuery(p, q)).toList();
                  if (all.isEmpty) {
                    return const EmptyState(
                      icon: Icons.home_work_outlined,
                      title: 'Nincs még projekt',
                      message: 'Az „Új projekt” gombbal indíthatsz egy felmérést és árajánlatot.',
                    );
                  }
                  if (list.isEmpty) {
                    return EmptyState(
                      icon: Icons.filter_alt_off_outlined,
                      title: 'Nincs találat',
                      message: q.isEmpty
                          ? 'Ebben a nézetben („${_filter.label}”) jelenleg nincs projekt.'
                          : 'Nincs a keresésnek megfelelő projekt.',
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(MpSpace.gutter, MpSpace.x2, MpSpace.gutter, 96),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const SizedBox(height: MpSpace.x3),
                    itemBuilder: (_, i) => ProjectCard(item: list[i], grossHuf: gross[list[i].project.id]),
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
