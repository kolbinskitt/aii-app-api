#!/bin/bash

# 📦 Podbij wersję (patch: x.y.z → x.y.z+1)
npm version patch --no-git-tag-version

# 📄 Git
git status
git add .
git commit -m "🔄 Auto version bump & commit"
git push

# 📢 Info
echo "✅ Wersja podbita do $(node -p "require('./package.json').version") i zmiany wypchnięte!"
