# Gunakan Python versi 3.11 (ringan dan cocok untuk AI service)
FROM python:3.11-slim

# Set working directory di dalam container
WORKDIR /app

# Copy file requirements terlebih dahulu (agar cache Docker optimal)
COPY requirements.txt .

# Install semua dependensi Python
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code yang ada di folder ai-service ke container
COPY . .

# Ekspos port 8000 agar SnapDeploy tahu port yang digunakan
EXPOSE 8000

# Perintah untuk menjalankan aplikasi saat container dimulai
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]