from typing import Iterable, Mapping, Sequence, Set

from app.rag.config import DEBUG_LOG_CONTENT


ROLE_TAGS = {
    "publico": {"publico"},
    "interno": {"publico", "interno"},
    "restrito": {"publico", "interno", "restrito"},
}


def allowed_tags_for_role(role: str) -> Set[str]:
    return ROLE_TAGS.get(role, ROLE_TAGS["publico"])


def enforce_rbac(
    chunks: Iterable[Mapping[str, any]], user_role: str
) -> Sequence[Mapping[str, any]]:
    tags = allowed_tags_for_role(user_role)
    filtered = []
    for chunk in chunks:
        chunk_tags = set(chunk.get("metadata", {}).get("rbac_tags", []))
        if chunk_tags & tags:
            filtered.append(chunk)
        elif DEBUG_LOG_CONTENT:
            print(
                f"RBAC filtered chunk {chunk.get('id')} for role {user_role} with tags {chunk_tags}"
            )
    return filtered
