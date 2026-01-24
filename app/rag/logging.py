import json
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from app.rag.config import LOG_DIR


class JsonLogger:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def log(
        self,
        level: str,
        event: str,
        correlation_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.upper(),
            "event": event,
        }
        if correlation_id:
            entry["correlation_id"] = correlation_id
        if details:
            entry["details"] = details

        line = json.dumps(entry, ensure_ascii=False)
        with self._lock:
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write(line + "\n")


logger = JsonLogger(LOG_DIR / "app.jsonl")
