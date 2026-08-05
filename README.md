# 📄 Local RAG — PDF Q&A Bot

A fully local, privacy-first **Retrieval-Augmented Generation** chatbot that lets you upload any PDF document and ask natural language questions about its content. No data ever leaves your machine — the LLM, embeddings, and vector store all run locally.

Built with **FastAPI**, **LangChain**, **Ollama**, and **ChromaDB**, it provides a clean ChatGPT-style web interface for interacting with your documents.

---

## ✨ Features

- **Upload any PDF** — drag & drop or click to browse
- **Instant semantic search** — documents are chunked, embedded, and indexed in a local vector store
- **AI-powered answers** — context-aware responses using a local LLM via Ollama
- **100% private** — everything runs on your machine, no API keys, no cloud
- **ChatGPT-style UI** — sidebar, chat history, typing indicators, auto-resizing input
- **Fast API backend** — clean REST endpoints for upload and query

---

## 🧩 Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Backend      | FastAPI (Python)                            |
| LLM          | Ollama — llama3.2                           |
| Embeddings   | HuggingFace — all-MiniLM-L6-v2             |
| Vector Store | ChromaDB                                    |
| Framework    | LangChain                                   |
| Frontend     | HTML / CSS / JavaScript (vanilla)           |

---

## 📋 Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- [Ollama](https://ollama.com/) installed and running
- Pull the model:
  ```bash
  ollama pull llama3.2
  ```

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/VishnuVardhanReddyKothapuli/Local-RAG-PDF-QnA-Bot.git
cd Local-RAG-PDF-QnA-Bot

# Create and activate virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

Open **http://localhost:8000** in your browser, upload a PDF, and start asking questions.

---

## 🐳 Docker

### Build & Run

```bash
docker build -t localrag .
docker run -d --name localrag -p 8000:8000 --network host localrag
```

> `--network host` allows the container to reach Ollama on the host. On macOS/Windows Docker Desktop, use `host.docker.internal` instead.

### Docker Compose

```bash
docker compose up -d
```

---

## 📁 Project Structure

```
Local-RAG-PDF-QnA-Bot/
├── main.py              # FastAPI app + RAG pipeline
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container image
├── docker-compose.yml   # Compose orchestration
├── .dockerignore
├── .gitignore
├── static/
│   ├── index.html       # Chat UI
│   ├── style.css        # Styling
│   └── app.js           # Frontend logic
└── uploads/             # User-uploaded PDFs (runtime)
```

---

## 🔌 API Endpoints

| Method | Endpoint  | Description              |
|--------|-----------|--------------------------|
| GET    | `/`       | Serves the chat UI       |
| POST   | `/upload` | Upload and index a PDF   |
| POST   | `/query`  | Ask a question           |

### Upload a PDF

```bash
curl -F "file=@document.pdf" http://localhost:8000/upload
```

### Ask a question

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this document about?"}'
```

---

## ⚙️ How It Works

1. **Upload** — user uploads a PDF through the web UI
2. **Chunk** — the document is split into overlapping text chunks (400 chars, 40 overlap)
3. **Embed** — each chunk is embedded using `all-MiniLM-L6-v2` via HuggingFace
4. **Index** — embeddings are stored in a local ChromaDB vector store
5. **Query** — user's question is embedded, top-3 similar chunks are retrieved
6. **Answer** — retrieved context + question are sent to `llama3.2` via Ollama to generate an answer

---

## 📝 License

MIT
