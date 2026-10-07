/// Felhasználónak szóló hiba: az üzenete magyar, és változtatás nélkül
/// megjeleníthető. Az [ArgumentError]-ból származik, így a bevitel-ellenőrzés
/// szerződése (és a tesztek `throwsArgumentError` elvárása) változatlan.
class UserInputError extends ArgumentError {
  UserInputError(String super.message);

  @override
  String get message => super.message as String;

  @override
  String toString() => message;
}
