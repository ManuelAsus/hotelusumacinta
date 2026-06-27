from pathlib import Path
p = Path('web/editar_pagina_principal.html')
text = p.read_text(encoding='utf-8')
text = text.replace('''            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>''', '''            <label style="margin-top:8px">Capacidad</label>
            <input data-room-capacity-index="${i}" class="roomCapacity" type="text" value="${escapeHtml(capacity)}">
            <label style="margin-top:8px">Comodidades</label>
            <textarea data-room-features-index="${i}" class="roomFeatures" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
            <label style="margin-top:8px">Descripción</label>
            <textarea data-room-desc-index="${i}" class="roomDesc">${escapeHtml(desc)}</textarea>''', 1)
text = text.replace('''          <label style="margin-top:8px">Capacidad</label>
          <input data-new-room-capacity-index="${index}" class="roomCapacityNew" type="text" value="${escapeHtml(capacity)}">
          <label style="margin-top:8px">Descripción</label>
          <textarea data-new-room-desc-index="${index}" class="roomDescNew">${escapeHtml(desc)}</textarea>''', '''          <label style="margin-top:8px">Capacidad</label>
          <input data-new-room-capacity-index="${index}" class="roomCapacityNew" type="text" value="${escapeHtml(capacity)}">
          <label style="margin-top:8px">Comodidades</label>
          <textarea data-new-room-features-index="${index}" class="roomFeaturesNew" placeholder="Internet, TV Cable, Aire Acondicionado">${escapeHtml(features)}</textarea>
          <label style="margin-top:8px">Descripción</label>
          <textarea data-new-room-desc-index="${index}" class="roomDescNew">${escapeHtml(desc)}</textarea>''', 1)
p.write_text(text, encoding='utf-8')
print('updated')
