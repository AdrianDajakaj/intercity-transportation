#!/bin/bash

# Skrypt do uruchamiania aplikacji na serwerze SSH z przekierowaniem portów
# Instrukcja użycia:
# 1. Skopiuj plik .env.example do .env
# 2. Edytuj .env i ustaw BASE_PATH na właściwą wartość (np. /3000/ lub /twoj_login/)
# 3. Uruchom: ./start-server.sh

echo "🚀 Uruchamianie Intercity Transportation System..."

if [ ! -f ".env" ]; then
    echo "⚠️  Plik .env nie istnieje!"
    echo "📋 Kopiuję .env.example do .env..."
    cp .env.example .env
    echo "✏️  Edytuj plik .env i ustaw BASE_PATH zgodnie z konfiguracją serwera"
    echo "   Przykłady:"
    echo "   - Dla http://149.156.43.57/3000/ ustaw: BASE_PATH=/3000/"
    echo "   - Dla http://149.156.43.57/login_studenta/ ustaw: BASE_PATH=/login_studenta/"
    exit 1
fi

# Załaduj zmienne środowiskowe
source .env

echo "📁 BASE_PATH: ${BASE_PATH:-/}"
echo "🔌 PORT: ${PORT:-3000}"

# Sprawdź czy node_modules istnieją
if [ ! -d "node_modules" ]; then
    echo "📦 Instalacja zależności..."
    npm install
fi

# Uruchom aplikację
echo "▶️  Uruchamianie aplikacji..."
npm start
