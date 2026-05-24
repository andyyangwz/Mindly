import click
from flask.cli import with_appcontext

from .seeds import seed_all


@click.command("seed")
@click.option("--force", is_flag=True, help="Delete existing entries before seeding.")
@with_appcontext
def seed_command(force):
    """Seed the database with sample data."""
    try:
        results = seed_all(force=force)
        action = "Replaced" if force else "Seeded"
        for kind, entries in results.items():
            click.echo(f"  {action} {len(entries)} {kind}.")
    except RuntimeError as e:
        click.echo(f"Error: {e}", err=True)
