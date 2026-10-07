import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/tokens.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/widgets.dart';
import '../../data/repositories.dart';
import '../../domain/format.dart';

/// Projekt-kártya listákhoz. A bruttó összeget kívülről kapja (a dashboard
/// statisztikából), így nem számol saját maga.
class ProjectCard extends StatelessWidget {
  const ProjectCard({super.key, required this.item, required this.grossHuf});
  final ProjectWithCustomer item;
  final int? grossHuf;

  @override
  Widget build(BuildContext context) {
    final p = item.project;
    return MpCard(
      onTap: () => context.push(Routes.project(p.id)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.title, style: MpText.heading, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(item.customer.name, style: MpText.small, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const SizedBox(width: MpSpace.x3),
              StatusChip(p.status),
            ],
          ),
          const SizedBox(height: MpSpace.x4),
          const Divider(),
          const SizedBox(height: MpSpace.x3),
          Row(
            children: [
              Icon(Icons.schedule, size: 15, color: MpColors.inkFaint),
              const SizedBox(width: 6),
              Text(Fmt.date(p.updatedAt), style: MpText.mono),
              if (p.quoteNumber != null) ...[
                const SizedBox(width: MpSpace.x3),
                Text('· ${p.quoteNumber}', style: MpText.mono),
              ],
              const Spacer(),
              if (grossHuf != null) MoneyText(grossHuf!, style: MpText.money.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}
