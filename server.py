import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"[*] Launching J.A.R.V.I.S. Autonomous AI Assistant OS on http://localhost:{port}")
    uvicorn.run("server.main:app", host="0.0.0.0", port=port, reload=False)
