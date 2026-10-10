import os
import shutil

from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever

rag_chain = None
uploaded_filename = None


def build_rag_chain(pdf_path: str):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    splits = text_splitter.split_documents(docs)

    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
    )
    vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
    chroma_retriever = vectorstore.as_retriever(search_kwargs={'k': 5})
    
    bm25_retriever = BM25Retriever.from_documents(splits)
    bm25_retriever.k = 5
    
    retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, chroma_retriever], weights=[0.5, 0.5]
    )

    template = """You are a helpful assistant that provides detailed and comprehensive answers using the provided context.

Context:
{context}

Question: {question}

Provide a thorough, detailed answer to the question based on the context above. If the context doesn't contain enough
information, say so honestly."""

    prompt = ChatPromptTemplate.from_template(template)
    model = OllamaLLM(model='llama3.2')

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | model
        | StrOutputParser()
    )
    return chain


app = FastAPI()

static_dir = os.path.join(os.path.dirname(__file__), "static")
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str


class UploadResponse(BaseModel):
    message: str
    filename: str


@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(static_dir, "index.html"))


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    global rag_chain, uploaded_filename

    if not file.filename.lower().endswith(".pdf"):
        return UploadResponse(message="Only PDF files are supported.", filename="")

    save_path = os.path.join(uploads_dir, file.filename)
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    rag_chain = build_rag_chain(save_path)
    uploaded_filename = file.filename

    return UploadResponse(
        message=f"'{file.filename}' indexed successfully!",
        filename=file.filename,
    )


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    if rag_chain is None:
        return QueryResponse(answer="Please upload a PDF first.")
    answer = rag_chain.invoke(req.question)
    return QueryResponse(answer=answer)