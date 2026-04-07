# Local development only — run API and UI in two terminals.
.PHONY: help api frontend

help:
	@echo "BayesianHeartDisease — local dev"
	@echo "  Terminal 1:  make api"
	@echo "  Terminal 2:  make frontend   (or: cd frontend && VITE_DEV_PORT=5174 npm run dev if 5173 is busy)"
	@echo "  Then open:   http://localhost:5173  (or your VITE_DEV_PORT)"

api:
	cd api && python -m uvicorn main:app --host 127.0.0.1 --port 8000

frontend:
	cd frontend && npm run dev
