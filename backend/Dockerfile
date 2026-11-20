FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Installer Tesseract et les outils PDF
RUN apt-get update && apt-get install -y --no-install-recommends 
    tesseract-ocr 
    tesseract-ocr-fra 
    tesseract-ocr-eng 
    poppler-utils 
    && rm -rf /var/lib/apt/lists/*

# Vérifier l'installation de Tesseract
RUN which tesseract && tesseract --version

# Installer les dépendances Python
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copier le projet
COPY . .

# Démarrer FastAPI
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]