"""Read-only CLI for learning-intake manifests."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .contracts import ContractError, confirmation_card, validate_manifest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate learning intake without writes.")
    parser.add_argument("command", choices=("validate", "confirmation-card"))
    parser.add_argument("manifest", help="JSON path or - for stdin")
    args = parser.parse_args(argv)
    try:
        if args.manifest == "-":
            manifest = json.load(sys.stdin)
        else:
            with Path(args.manifest).open(encoding="utf-8") as handle:
                manifest = json.load(handle)
        if args.command == "validate":
            valid = validate_manifest(manifest)
            result = {
                "ok": True,
                "mode": "dry_run",
                "will_write": False,
                "module_id": valid["module_id"],
                "exam_id": valid["exam_id"],
                "dedup_key": valid["dedup_key"],
            }
        else:
            result = {"ok": True, "mode": "dry_run", "card": confirmation_card(manifest)}
    except ContractError as exc:
        result = {"ok": False, "mode": "dry_run", "will_write": False, "errors": exc.errors}
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
        return 1
    except (OSError, json.JSONDecodeError) as exc:
        result = {"ok": False, "mode": "dry_run", "will_write": False, "errors": [str(exc)]}
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
