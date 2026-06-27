import re
from pathlib import Path

p = Path('web/editar_pagina_principal.html')
text = p.read_text(encoding='utf-8')

# First replacement - existing rooms block
find1 = r'(<label style="margin-top:8px">Capacidad</label>.*?<label style="margin-top:8px">Descripción</label>)'
replace1 = r'''<label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Comodidades</label>
            <textarea data-room-features-index="${i}" class="roomFeatures" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
            <label style="margin-top:8px">Descripción</label>'''

# Check if it's the exact match for existing rooms
old_pattern1 = '''            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>'''
new_pattern1 = '''            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Comodidades</label>
            <textarea data-room-features-index="${i}" class="roomFeatures" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>'''

# First block - already has comodidades?
if new_pattern1 in text:
    print("First block already updated")
elif old_pattern1 in text:
    text = text.replace(old_pattern1, new_pattern1, 1)
    print("First block updated")
else:
    print("First block pattern not found")

# Second replacement - new rooms block  
old_pattern2 = '''          <label style="margin-top:8px">Capacidad</label>
          <input data-new-room-capacity-index="${index}" class="roomCapacityNew" type="text" value="${escapeHtml(capacity)}">
          <label style="margin-top:8px">Descripción</label>
          <textarea data-new-room-desc-index="${index}" class="roomDescNew">${escapeHtml(desc)}</textarea>'''
new_pattern2 = '''          <label style="margin-top:8px">Capacidad</label>
          <input data-new-room-capacity-index="${index}" class="roomCapacityNew" type="text" value="${escapeHtml(capacity)}">
          <label style="margin-top:8px">Comodidades</label>
          <textarea data-new-room-features-index="${index}" class="roomFeaturesNew" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
          <label style="margin-top:8px">Descripción</label>
          <textarea data-new-room-desc-index="${index}" class="roomDescNew">${escapeHtml(desc)}</textarea>'''

# Second block - already has comodidades?
if new_pattern2 in text:
    print("Second block already updated")
elif old_pattern2 in text:
    text = text.replace(old_pattern2, new_pattern2, 1)
    print("Second block updated")
else:
    print("Second block pattern not found")

p.write_text(text, encoding='utf-8')
print("Done")
