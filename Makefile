VENV ?= .venv
PYTHON ?= python

install:
\t$(PYTHON) -m pip install --upgrade pip
\t$(PYTHON) -m pip install -r requirements.txt

ingest:
\t$(PYTHON) -m app.rag.ingest

serve:
\t$(PYTHON) -m uvicorn app.api:app --reload

eval:
\t$(PYTHON) eval/run_eval.py

test:
\t$(PYTHON) -m pytest
