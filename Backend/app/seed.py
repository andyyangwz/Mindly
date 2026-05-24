import warnings

warnings.warn(
    "app.seed is deprecated. Use app.seeds.seed_all() instead.",
    DeprecationWarning,
    stacklevel=2,
)

from .seeds.journal_seeds import seed_journals as seed_database  # noqa: F401, E402
