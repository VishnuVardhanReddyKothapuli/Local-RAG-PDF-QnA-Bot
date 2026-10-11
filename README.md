# Local RAG PDF Q&A Bot

A privacy-focused Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents and ask questions about their content through a simple web interface.

The application combines semantic search and keyword-based retrieval to find relevant document passages, then uses a locally running LLM to generate context-aware answers. It is built with Python, FastAPI, LangChain, Ollama, and ChromaDB.

## Features

- **PDF Upload:** Upload PDF documents directly through the web interface.
- **Hybrid Search:** Combines semantic retrieval using ChromaDB with keyword-based retrieval using BM25.
- **Context-Aware Answers:** Uses retrieved document passages to generate relevant responses with a local LLM.
- **Local LLM Inference:** Runs Llama 3.2 through Ollama without requiring a cloud-based LLM API.
- **Local Vector Storage:** Stores document embeddings in ChromaDB for semantic retrieval.
- **Text Chunking:** Splits documents into overlapping chunks to improve retrieval.
- **REST API:** Provides FastAPI endpoints for document upload and question answering.
- **Simple Web Interface:** Interact with uploaded documents through an HTML, CSS, and JavaScript frontend.

## Tech Stack

| Component | Technology |
|---|---|
| Programming Language | Python |
| Backend | FastAPI |
| LLM | Llama 3.2 via Ollama |
| LLM Framework | LangChain |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` |
| Vector Database | ChromaDB |
| Keyword Retrieval | BM25 |
| Hybrid Retrieval | LangChain `EnsembleRetriever` |
| PDF Processing | PyPDF |
| Text Splitting | RecursiveCharacterTextSplitter |
| Frontend | HTML, CSS, JavaScript |
| Server | Uvicorn |

## How It Works

The application follows a Retrieval-Augmented Generation pipeline:

1. **PDF Upload:** The user uploads a PDF through the web interface.
2. **Text Extraction:** PyPDF extracts text and page information from the document.
3. **Text Chunking:** The extracted content is divided into chunks of 1,000 characters with a 200-character overlap.
4. **Embedding Generation:** HuggingFace's `all-MiniLM-L6-v2` model converts the chunks into vector embeddings.
5. **Indexing:** The chunks are indexed in ChromaDB for semantic search and BM25 for keyword-based retrieval.
6. **Hybrid Retrieval:** An EnsembleRetriever combines both retrieval methods with equal weights and retrieves up to five results from each retriever.
7. **Answer Generation:** The retrieved context and user question are passed to Llama 3.2 through Ollama.
8. **Response Delivery:** The generated answer is returned through the FastAPI backend and displayed in the interface.

## Architecture

```text
                PDF Document
                     |
                     v
              PDF Text Extraction
                     |
                     v
                Text Chunking
              (1000 / 200 overlap)
                     |
                     v
             Embedding Generation
                     |
             +-------+-------+
             |               |
             v               v
         ChromaDB           BM25
      Semantic Search   Keyword Search
             |               |
             +-------+-------+
                     |
                     v
             Hybrid Retrieval
                     |
                     v
             Retrieved Context
                     |
                     v
              Ollama Llama 3.2
                     |
                     v
              Generated Answer
                     |
                     v
              Web Interface
```

## Prerequisites

Before running the application, install the following:

- Python 3.10 or later
- [Ollama](https://ollama.com/)
- Git

Download the required LLM using Ollama:

```bash
ollama pull llama3.2
```

Make sure Ollama is running before starting the application.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/VishnuVardhanReddyKothapuli/Local-RAG-PDF-QnA-Bot.git

cd Local-RAG-PDF-QnA-Bot
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate the environment.

**Windows:**

```bash
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the application

```bash
uvicorn main:app --reload
```

Open the application in your browser:

http://127.0.0.1:8000

Upload a PDF document and start asking questions about its contents.

## API Endpoints

The application exposes the following REST endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Serves the web interface |
| POST | `/upload` | Uploads and indexes a PDF |
| POST | `/query` | Answers a question using the indexed PDF |

### Upload a PDF

```bash
curl -X POST \
  -F "file=@document.pdf" \
  http://127.0.0.1:8000/upload
```

Example response:

```json
{
  "message": "'document.pdf' indexed successfully!",
  "filename": "document.pdf"
}
```

### Ask a Question

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"What is this document about?\"}" \
  http://127.0.0.1:8000/query
```

Example response:

```json
{
  "answer": "The answer is generated using relevant context retrieved from the uploaded PDF."
}
```

The example answer above is illustrative; actual responses depend on the uploaded document and the question.

## Project Structure

```text
Local-RAG-PDF-QnA-Bot/
|
├── main.py
│   └── FastAPI application and RAG pipeline
|
├── requirements.txt
│   └── Python dependencies
|
├── static/
│   ├── index.html
│   ├── style.css
│   └── app.js
|
├── .gitignore
└── README.md
```

The `uploads/` directory is created automatically when the application starts and stores uploaded PDF files at runtime.

## Why Hybrid Search?

Traditional semantic search identifies passages based on the meaning of a query, while keyword-based search can find exact terms, names, and technical phrases.

This project combines both approaches through LangChain's `EnsembleRetriever`:

- **Semantic Search:** ChromaDB retrieves passages based on vector similarity.
- **Keyword Search:** BM25 retrieves passages based on keyword relevance.
- **Combined Retrieval:** Both retrievers use equal weights to improve the chances of finding relevant document content.

The retrieved passages are then provided to the LLM as context for answer generation.

## Limitations

- The application currently supports PDF documents only.
- The application maintains one active RAG chain for the most recently uploaded PDF.
- Answers depend on the quality of the extracted text and retrieved passages.
- Ollama and the selected model must be available locally.
- Embedding models may need to be downloaded during initial setup.
- The current implementation returns generated answers without explicit source citations in the API response.
- This is a learning project and should be strengthened with authentication, validation, error handling, and production deployment controls before being used with sensitive documents.

## Future Improvements

- Add source citations with PDF page numbers.
- Support querying multiple documents simultaneously.
- Improve retrieval using reranking and retrieval evaluation.
- Add conversational memory for follow-up questions.
- Introduce automated tests and improved error handling.
- Add Docker-based deployment and production configuration.
- Evaluate retrieval quality and answer relevance using a benchmark dataset.

## Author

**Vishnu Vardhan Reddy Kothapuli**

GitHub: [VishnuVardhanReddyKothapuli](https://github.com/VishnuVardhanReddyKothapuli)

Project Repository: [Local-RAG-PDF-QnA-Bot](https://github.com/VishnuVardhanReddyKothapuli/Local-RAG-PDF-QnA-Bot)
