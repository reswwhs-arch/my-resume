#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для сбора всего кода проекта в один файл
Запуск: python collect_code.py
"""

import os
from datetime import datetime

# Путь к директории скрипта
script_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(script_dir, "project-code.txt")

files_to_collect = [
    "package.json",
    "index.html",
    "src/App.jsx",
    "src/App.css",
    "src/index.css",
    "src/main.jsx",
    "src/AIChat.jsx"
]

separator = "\n" + "=" * 80 + "\n\n"

content = "=== PROJECT CODE COLLECTION ===\n"
content += "Project: my-resume (React Portfolio)\n"
content += f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
content += separator

for file_path in files_to_collect:
    full_path = os.path.join(script_dir, file_path)
    
    content += f"=== FILE: {file_path} ===\n\n"
    
    if os.path.exists(full_path):
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
            content += file_content
        except Exception as e:
            content += f"[ERROR READING FILE: {e}]\n"
    else:
        content += "[FILE NOT FOUND]\n"
    
    content += separator

# Запись в файл
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

file_size = os.path.getsize(output_file)
print(f"✓ Код проекта собран в файл: {output_file}")
print(f"✓ Размер файла: {file_size} байт")
