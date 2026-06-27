from pathlib import Path
p = Path('web/editar_pagina_principal.html')
text = p.read_text(encoding='utf-8')
old1 = '''            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>'''
new1 = '''            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Comodidades</label>
            <textarea data-room-features-index="${i}" class="roomFeatures" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>'''
old2 = '''          <label style="margin-top:8px">Capacidad</label>
          <input data-new-room-capacity-index="${index}" class="roomCapacityNew" type="text" value="${escapeHtml(capacity)}">
          <label style="margin-top:8px">Descripción</label>
          <textarea data-new-room-desc-index="${index}" class="roomDescNew">${escapeHtml(desc)}</textarea>'''
new2 = '''          <label style="margin-top:8px">Capacidad</label>
          <input data-new-room-capacity-index="${index}" class="roomCapacityNew" type="text" value="${escapeHtml(capacity)}">
          <label style="margin-top:8px">Comodidades</label>
          <textarea data-new-room-features-index="${index}" class="roomFeaturesNew" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
          <label style="margin-top:8px">Descripción</label>
          <textarea data-new-room-desc-index="${index}" class="roomDescNew">${escapeHtml(desc)}</textarea>'''
if old1 not in text:
    raise SystemExit('first block not found')
if old2 not in text:
    raise SystemExit('second block not found')
text = text.replace(old1, new1, 1)
text = text.replace(old2, new2, 1)
p.write_text(text, encoding='utf-8')
print('updated')
