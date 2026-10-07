import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/customers/customer_detail_screen.dart';
import '../../features/customers/customer_form_screen.dart';
import '../../features/customers/customers_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/prices/price_item_form_screen.dart';
import '../../features/prices/price_list_screen.dart';
import '../../features/projects/calculation_screen.dart';
import '../../features/projects/new_project_screen.dart';
import '../../features/projects/pricing_screen.dart';
import '../../features/projects/project_hub_screen.dart';
import '../../features/projects/projects_screen.dart';
import '../../features/projects/quote_preview_screen.dart';
import '../../features/projects/survey_screen.dart';
import '../../features/projects/work_items_screen.dart';
import '../../features/settings/settings_screen.dart';
import 'app_shell.dart';

final _rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');

/// Útvonal-paraméter biztonságos olvasása: hibás id esetén -1, amire a
/// képernyők "nem található" állapottal reagálnak (nem dob kivételt).
int _id(GoRouterState s, [String name = 'id']) => int.tryParse(s.pathParameters[name] ?? '') ?? -1;

abstract final class Routes {
  static const dashboard = '/dashboard';
  static const projects = '/projects';
  static const customers = '/customers';
  static const prices = '/prices';
  static const settings = '/settings';

  static String newProject({int? customerId}) =>
      customerId == null ? '/project/new' : '/project/new?customerId=$customerId';
  static String project(int id) => '/project/$id';
  static String survey(int id) => '/project/$id/survey';
  static String items(int id) => '/project/$id/items';
  static String pricing(int id) => '/project/$id/pricing';
  static String calculation(int id) => '/project/$id/calculation';
  static String quote(int id) => '/project/$id/quote';

  static const newCustomer = '/customer/new';
  static String customer(int id) => '/customer/$id';
  static String editCustomer(int id) => '/customer/$id/edit';

  static const newPriceItem = '/price/new';
  static String priceItem(int id) => '/price/$id';
}

GoRouter buildRouter() => GoRouter(
      navigatorKey: _rootKey,
      initialLocation: Routes.dashboard,
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (context, state, shell) => AppShell(navigationShell: shell),
          branches: [
            StatefulShellBranch(routes: [
              GoRoute(path: Routes.dashboard, builder: (_, _) => const DashboardScreen()),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(path: Routes.projects, builder: (_, _) => const ProjectsScreen()),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(path: Routes.customers, builder: (_, _) => const CustomersScreen()),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(path: Routes.prices, builder: (_, _) => const PriceListScreen()),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(path: Routes.settings, builder: (_, _) => const SettingsScreen()),
            ]),
          ],
        ),

        // ── Teljes képernyős folyamat (a fülsáv fölött) ──
        GoRoute(
          path: '/project/new',
          parentNavigatorKey: _rootKey,
          builder: (_, s) => NewProjectScreen(
            initialCustomerId: int.tryParse(s.uri.queryParameters['customerId'] ?? ''),
          ),
        ),
        GoRoute(
          path: '/project/:id',
          parentNavigatorKey: _rootKey,
          builder: (_, s) => ProjectHubScreen(projectId: _id(s)),
          routes: [
            GoRoute(path: 'survey', builder: (_, s) => SurveyScreen(projectId: _id(s))),
            GoRoute(path: 'items', builder: (_, s) => WorkItemsScreen(projectId: _id(s))),
            GoRoute(path: 'pricing', builder: (_, s) => PricingScreen(projectId: _id(s))),
            GoRoute(path: 'calculation', builder: (_, s) => CalculationScreen(projectId: _id(s))),
            GoRoute(path: 'quote', builder: (_, s) => QuotePreviewScreen(projectId: _id(s))),
          ],
        ),
        GoRoute(
          path: '/customer/new',
          parentNavigatorKey: _rootKey,
          builder: (_, _) => const CustomerFormScreen(),
        ),
        GoRoute(
          path: '/customer/:id',
          parentNavigatorKey: _rootKey,
          builder: (_, s) => CustomerDetailScreen(customerId: _id(s)),
          routes: [
            GoRoute(path: 'edit', builder: (_, s) => CustomerFormScreen(customerId: _id(s))),
          ],
        ),
        GoRoute(
          path: '/price/new',
          parentNavigatorKey: _rootKey,
          builder: (_, _) => const PriceItemFormScreen(),
        ),
        GoRoute(
          path: '/price/:id',
          parentNavigatorKey: _rootKey,
          builder: (_, s) => PriceItemFormScreen(priceItemId: _id(s)),
        ),
      ],
    );
