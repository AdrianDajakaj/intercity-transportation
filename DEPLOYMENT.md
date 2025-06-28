# Intercity Transportation System - Wdrożenie na serwerze SSH

## 🚀 Instrukcja wdrożenia na serwerze z przekierowaniem portów

### Wymagania wstępne
- Node.js (wersja 14 lub nowsza)
- npm
- Dostęp SSH do serwera
- Skonfigurowana baza danych MySQL

### Krok 1: Przygotowanie konfiguracji

1. **Skopiuj plik konfiguracyjny:**
   ```bash
   cp .env.example .env
   ```

2. **Edytuj plik .env zgodnie z konfiguracją serwera:**
   
   **Dla URL `http://149.156.43.57:3000` → `http://149.156.43.57/3000/`:**
   ```
   BASE_PATH=/3000/
   ```
   
   **Dla URL z kodem projektu (np. login studenta):**
   ```
   BASE_PATH=/twoj_login_studenta/
   ```

3. **Skonfiguruj inne zmienne:**
   ```
   PORT=3000
   SESSION_SECRET=bezpieczny_klucz_sesji
   DB_HOST=localhost
   DB_USER=nazwa_uzytkownika_bazy
   DB_PASSWORD=haslo_do_bazy
   DB_NAME=intercity_transportation
   ```

### Krok 2: Instalacja i uruchomienie

1. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

2. **Uruchom aplikację (opcja 1 - ręcznie):**
   ```bash
   npm start
   ```

3. **Uruchom aplikację (opcja 2 - skryptem):**
   ```bash
   ./start-server.sh
   ```

### Krok 3: Weryfikacja

1. **Sprawdź lokalnie:**
   - Aplikacja powinna być dostępna na `http://localhost:3000`
   - Wszystkie linki powinny używać BASE_PATH

2. **Sprawdź na serwerze:**
   - Aplikacja powinna być dostępna pod adresem zgodnym z BASE_PATH
   - Np. `http://149.156.43.57/3000/` lub `http://149.156.43.57/twoj_login/`

### 🔧 Zmiany wprowadzone dla zgodności z serwerem

#### ✅ Backend (Node.js/Express):
- ✅ Dodano obsługę `BASE_PATH` z zmiennych środowiskowych
- ✅ Wszystkie routes używają `BASE_PATH`
- ✅ Middleware dla plików statycznych uwzględnia `BASE_PATH`
- ✅ Przekazywanie `basePath` do wszystkich widoków

#### ✅ Frontend (HTML/JavaScript):
- ✅ Wszystkie linki w widokach używają `basePath`
- ✅ Pliki CSS i JS ładowane z relatywną ścieżką
- ✅ Wszystkie zapytania AJAX używają `window.BASE_PATH`
- ✅ Przekierowania po logowaniu uwzględniają `BASE_PATH`

#### ✅ Pliki statyczne:
- ✅ CSS, JS, fonty dostępne pod poprawną ścieżką
- ✅ Obrazy i inne zasoby uwzględniają BASE_PATH

### 🐛 Rozwiązywanie problemów

**Problem: 404 na pliki CSS/JS**
- Sprawdź czy BASE_PATH w .env kończy się na `/`
- Upewnij się, że pliki statyczne są dostępne

**Problem: API calls 404**
- Sprawdź czy wszystkie pliki JS używają `window.BASE_PATH`
- Sprawdź console przeglądarki pod kątem błędów

**Problem: Niepoprawne linki**
- Sprawdź czy wszystkie widoki używają `<%= basePath %>`
- Upewnij się, że basePath jest przekazywany do widoków

### 📅 Harmonogram wdrożenia

**Zalecany harmonogram (termin: 28 czerwca):**
- 26 czerwca: Wdrożenie na serwer testowy
- 27 czerwca: Testy funkcjonalności i poprawki
- 28 czerwca: Finalne wdrożenie

### 🔐 Bezpieczeństwo

- Zmień `SESSION_SECRET` na bezpieczny klucz
- Skonfiguruj HTTPS jeśli dostępne (ustaw `cookie.secure: true`)
- Zabezpiecz dane dostępowe do bazy danych

### 📞 Wsparcie

W przypadku problemów sprawdź:
1. Logi serwera (`console.log` w aplikacji)
2. Logi przeglądarki (F12 → Console)
3. Konfigurację serwera SSH i przekierowań portów
