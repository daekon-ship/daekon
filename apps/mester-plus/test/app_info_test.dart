import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/core/app_info.dart';

void main() {
  test('az appVersion megegyezik a pubspec.yaml verziójával', () {
    final pubspec = File('pubspec.yaml').readAsStringSync();
    final m = RegExp(r'^version:\s*([0-9.]+)\+\d+', multiLine: true).firstMatch(pubspec);
    expect(m, isNotNull);
    expect(appVersion, m!.group(1));
  });
}
