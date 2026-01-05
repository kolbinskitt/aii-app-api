#!/bin/bash

# 1. Dodaj wszystkie zmiany
git add .

# 2. Zapytaj o wiadomość commita
echo "📝 Podaj wiadomość commita:"
read commit_message

# 3. Wykonaj commit
git commit -m "$commit_message"

# 4. Wypchnij na zdalne repozytorium
git push

echo "✅ Zmiany zostały wypchnięte!"
