"""Read-only CLI for learning-intake manifests."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .contracts import ContractError, confirmation_card, validate_manifest
from .direct_context import DirectContextError, build_pdf_manifest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prepare learning intake without writes.")
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("validate", "confirmation-card"):
        command = commands.add_parser(name)
        command.add_argument("manifest", help="JSON path or - for stdin")
    analyze = commands.add_parser("analyze-pdf")
    analyze.add_argument("pdf", help="Bounded local text PDF (up to 200 pages)")
    analyze.add_argument("--tenant", required=True, help="University tenant, for example uni:tum")
    analyze.add_argument("--module", required=True, dest="module_id")
    analyze.add_argument("--exam", required=True, dest="exam_id")
    analyze.add_argument("--exam-date", required=True)
    analyze.add_argument("--question", required=True)
    analyze.add_argument("--partition", type=int, dest="selected_partition")
    args = parser.parse_args(argv)
    try:
        if args.command == "analyze-pdf":
            manifest = build_pdf_manifest(
                args.pdf,
                tenant_id=args.tenant,
                module_id=args.module_id,
                exam_id=args.exam_id,
                exam_date=args.exam_date,
                question=args.question,
                selected_partition=args.selected_partition,
            )
            result = {
                "ok": True,
                "mode": "direct_context",
                "will_write": False,
                "manifest": manifest,
            }
        else:
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
    except (ContractError, DirectContextError) as exc:
        errors = exc.errors if isinstance(exc, ContractError) else [str(exc)]
        result = {"ok": False, "mode": "dry_run", "will_write": False, "errors": errors}
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
