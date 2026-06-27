from pathlib import Path
p = Path('web/editar_pagina_principal.html')
text = p.read_text(encoding='utf-8')
old = '''            <label style="margin-top:8px">Título</label>
            <input data-room-title-index="${i}" class="roomTitle" type="text" value="${escapeHtml(title)}">
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>'''
new = '''            <label style="margin-top:8px">Título</label>
            <input data-room-title-index="${i}" class="roomTitle" type="text" value="${escapeHtml(title)}">
            <label style="margin-top:8px">Precio</label>
            <input data-room-price-index="${i}" class="roomPrice" type="text" value="${escapeHtml(price)}">
            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>'''
count = text.count(old)
if count == 0:
    raise SystemExit('pattern not found')
text = text.replace(old, new, count)
p.write_text(text, encoding='utf-8')
print(f'updated {count} occurrence(s)')
