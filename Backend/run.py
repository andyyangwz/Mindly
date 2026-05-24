from app import create_app, verify_db

app = create_app()

if __name__ == "__main__":
    import os
    import sys

    port = int(os.getenv("FLASK_RUN_PORT", 8080))
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")

    print(f"\n  Verifying database connection...")
    db_ok = verify_db(app)
    if not db_ok:
        print("\n  FATAL: Database connection failed. Check DATABASE_URL in .env")
        sys.exit(1)

    print(f"\n  Backend starting on http://{host}:{port}")
    print(f"  Environment: {os.getenv('FLASK_ENV', 'production')}")
    print(f"  Press Ctrl+C to stop\n")
    print("  Routes:")
    for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
        methods = ",".join(sorted(rule.methods - {"OPTIONS", "HEAD"}))
        if methods:
            print(f"    {methods:6s} {rule.rule}")
    print()

    app.run(debug=True, host=host, port=port)
