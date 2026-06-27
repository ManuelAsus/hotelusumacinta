from pathlib import Path
import re

p = Path('web/editar_pagina_principal.html')
text = p.read_text(encoding='utf-8')

patterns = [
    (
        r'<label style="margin-top:8px">Título</label>\s*<input data-room-title-index="\$\{i\}" class="roomTitle" type="text" value="\$\{escapeHtml\(title\)\}">\s*<label style="margin-top:8px">Descripción</label>',
        '<label style="margin-top:8px">Título</label>\n            <input data-room-title-index="${i}" class="roomTitle" type="text" value="${escapeHtml(title)}">\n            <label style="margin-top:8px">Precio</label>\n            <input data-room-price-index="${i}" class="roomPrice" type="text" value="${escapeHtml(price)}">\n            <label style="margin-top:8px">Capacidad</label>\n            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">\n            <label style="margin-top:8px">Descripción</label>'
    ),
    (
        r'<label style="margin-top:8px">Precio</label>\s*<input data-room-price-index="\$\{i\}" class="roomPrice" type="text" value="\$\{escapeHtml\(price\)\}">\s*<label style="margin-top:8px">Descripción</label>',
        '<label style="margin-top:8px">Precio</label>\n            <input data-room-price-index="${i}" class="roomPrice" type="text" value="${escapeHtml(price)}">\n            <label style="margin-top:8px">Capacidad</label>\n            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">\n            <label style="margin-top:8px">Descripción</label>'
    ),
]

for pattern, replacement in patterns:
    text, count = re.subn(pattern, replacement, text)
    print(f'pattern {pattern[:40]} -> {count}')

p.write_text(text, encoding='utf-8')
print('done')
