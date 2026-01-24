from app.security.rbac import enforce_rbac


def _sample_chunk(tags):
    return {"metadata": {"rbac_tags": tags}, "chunk_id": "id"}


def test_public_role_sees_public_chunks():
    chunks = [
        _sample_chunk(["publico"]),
        _sample_chunk(["interno"]),
        _sample_chunk(["restrito"]),
    ]
    filtered = enforce_rbac(chunks, "publico")
    assert len(filtered) == 1


def test_restrito_role_sees_all():
    chunks = [
        _sample_chunk(["publico"]),
        _sample_chunk(["interno"]),
        _sample_chunk(["restrito"]),
    ]
    filtered = enforce_rbac(chunks, "restrito")
    assert len(filtered) == 3
