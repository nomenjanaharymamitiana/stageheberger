#!/usr/bin/env bash
set -o errexit

apt-get update
apt-get install -y tesseract-ocr tesseract-ocr-fra tesseract-ocr-eng poppler-utils

pip install -r backend/requirements.txt