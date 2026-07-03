const roomRates = {
  'Matrimonial': 1800,
  'King Size': 2200,
  'Presidencial': 3200,
  'Individual': 1200
};

const extraRates = {
  desayuno: 180,
  transporte: 250,
  limpieza: 120
};

const form = document.getElementById('invoiceForm');
const invoiceItems = document.getElementById('invoiceItems');
const subtotalEl = document.getElementById('subtotal');
const ivaEl = document.getElementById('iva');
const discountValueEl = document.getElementById('discountValue');
const totalEl = document.getElementById('total');
const invoiceTitleEl = document.getElementById('invoiceTitle');
const invoiceNumberEl = document.getElementById('invoiceNumber');
const invoiceDateEl = document.getElementById('invoiceDate');
const previewClienteEl = document.getElementById('previewCliente');
const previewContactoEl = document.getElementById('previewContacto');
const previewRfcEl = document.getElementById('previewRfc');
const previewFolioEl = document.getElementById('previewFolio');
const previewPagoEl = document.getElementById('previewPago');
const previewFechaEl = document.getElementById('previewFecha');
const previewObservacionesEl = document.getElementById('previewObservaciones');
const previewRazonSocialEl  = document.getElementById('previewRazonSocial');
const previewCpFiscalEl     = document.getElementById('previewCpFiscal');
const previewRegimenFiscalEl = document.getElementById('previewRegimenFiscal');
const previewUsoCFDIEl      = document.getElementById('previewUsoCFDI');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function buildInvoiceData(formData) {
  const habitacion = formData.get('habitacion');
  const noches = parseInt(formData.get('noches') || '1', 10);
  const descuentoPct = parseFloat(formData.get('descuento') || '0');
  const desayuno = document.getElementById('desayuno').checked;
  const transporte = document.getElementById('transporte').checked;
  const limpieza = document.getElementById('limpieza').checked;

  const roomBase = roomRates[habitacion] * noches;
  const extras = [
    desayuno ? { label: 'Desayuno', amount: extraRates.desayuno } : null,
    transporte ? { label: 'Transporte', amount: extraRates.transporte } : null,
    limpieza ? { label: 'Limpieza', amount: extraRates.limpieza } : null
  ].filter(Boolean);

  const subtotal = roomBase + extras.reduce((sum, item) => sum + item.amount, 0);
  const iva = subtotal * 0.16;
  const descuento = subtotal * (descuentoPct / 100);
  const total = subtotal + iva - descuento;

  return {
    roomBase,
    extras,
    subtotal,
    iva,
    descuento,
    total,
    habitacion,
    noches,
    descuentoPct
  };
}

function renderInvoice(data, formData) {
  const cliente      = formData.get('cliente')  || 'Sin nombre';
  const correo       = formData.get('correo')   || 'Sin correo';
  const telefono     = formData.get('telefono') || 'Sin teléfono';
  const rfc          = (document.getElementById('rfc').value || '').toUpperCase() || '—';
  const razonSocial  = (document.getElementById('razonSocial')?.value  || '').toUpperCase() || '—';
  const cpFiscal     = document.getElementById('cpFiscal')?.value      || '—';
  const regimenFiscal = document.getElementById('regimenFiscal')?.value || '—';
  const usoCFDI      = document.getElementById('usoCFDI')?.value       || '—';
  const folio        = document.getElementById('folio').value          || 'Sin folio';
  const pago         = document.getElementById('pago').value           || 'Sin forma de pago';
  const fechaEmision = document.getElementById('fechaEmision').value;
  const observaciones = document.getElementById('observaciones').value || 'Sin observaciones.';
  const invoiceNumber = folio || `FAC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100+Math.random()*900)}`;
  const invoiceDate   = fechaEmision
    ? new Date(fechaEmision + 'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' })
    : new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });

  invoiceTitleEl.textContent    = `Factura ${invoiceNumber}`;
  invoiceNumberEl.textContent   = `Factura: ${invoiceNumber}`;
  invoiceDateEl.textContent     = `Fecha: ${invoiceDate}`;
  previewClienteEl.textContent  = cliente;
  previewContactoEl.textContent = `${correo} • ${telefono}`;
  previewRfcEl.textContent      = `RFC: ${rfc}`;
  if (previewRazonSocialEl)   previewRazonSocialEl.textContent   = `Razón Social: ${razonSocial}`;
  if (previewCpFiscalEl)      previewCpFiscalEl.textContent      = `C.P. Fiscal: ${cpFiscal}`;
  if (previewRegimenFiscalEl) previewRegimenFiscalEl.textContent = `Régimen: ${regimenFiscal}`;
  if (previewUsoCFDIEl)       previewUsoCFDIEl.textContent       = `Uso CFDI: ${usoCFDI}`;
  previewFolioEl.textContent    = folio;
  previewPagoEl.textContent     = pago;
  previewFechaEl.textContent    = invoiceDate;
  previewObservacionesEl.textContent = observaciones;

  invoiceItems.innerHTML = '';
  const roomRow = document.createElement('tr');
  roomRow.innerHTML = `<td>Hospedaje</td><td>${data.habitacion} × ${data.noches} noche(s)</td><td>${formatCurrency(data.roomBase)}</td>`;
  invoiceItems.appendChild(roomRow);

  data.extras.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>Servicio adicional</td><td>${item.label}</td><td>${formatCurrency(item.amount)}</td>`;
    invoiceItems.appendChild(row);
  });

  subtotalEl.textContent = formatCurrency(data.subtotal);
  ivaEl.textContent = formatCurrency(data.iva);
  discountValueEl.textContent = `-${formatCurrency(data.descuento)}`;
  totalEl.textContent = formatCurrency(data.total);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const data = buildInvoiceData(formData);
  renderInvoice(data, formData);
});

resetBtn.addEventListener('click', () => {
  form.reset();
  document.getElementById('noches').value = '2';
  document.getElementById('descuento').value = '0';
  document.getElementById('habitacion').value = 'Matrimonial';
  document.getElementById('pago').value = 'Efectivo';
  document.getElementById('folio').value = 'F-2026-001';
  document.getElementById('observaciones').value = '';
  invoiceItems.innerHTML = '';
  subtotalEl.textContent = '$0.00';
  ivaEl.textContent = '$0.00';
  discountValueEl.textContent = '$0.00';
  totalEl.textContent = '$0.00';
  invoiceTitleEl.textContent = 'Factura preliminar';
  invoiceNumberEl.textContent = 'Factura preliminar';
  invoiceDateEl.textContent = 'Fecha: --';
  previewClienteEl.textContent = 'Sin datos';
  previewContactoEl.textContent = 'Correo y teléfono aparecerán aquí';
  previewRfcEl.textContent = 'RFC: --';
  previewFolioEl.textContent = '--';
  previewPagoEl.textContent = '--';
  previewFechaEl.textContent = '--';
  previewObservacionesEl.textContent = 'Sin observaciones.';
  if (previewRazonSocialEl)   previewRazonSocialEl.textContent   = 'Razón Social: --';
  if (previewCpFiscalEl)      previewCpFiscalEl.textContent      = 'C.P. Fiscal: --';
  if (previewRegimenFiscalEl) previewRegimenFiscalEl.textContent = 'Régimen: --';
  if (previewUsoCFDIEl)       previewUsoCFDIEl.textContent       = 'Uso CFDI: --';
});

downloadBtn.addEventListener('click', async () => {
  const invoiceTitle = document.getElementById('invoiceTitle').textContent;
  const invoiceText = [
    'HOTEL CASA USUMACINTA',
    'Factura simulada',
    '========================',
    invoiceTitle,
    document.getElementById('invoiceDate').textContent,
    'Cliente: ' + document.getElementById('previewCliente').textContent,
    'Contacto: ' + document.getElementById('previewContacto').textContent,
    'RFC: ' + document.getElementById('previewRfc').textContent,
    'Razón Social: ' + (document.getElementById('previewRazonSocial')?.textContent || '--'),
    'C.P. Fiscal: ' + (document.getElementById('previewCpFiscal')?.textContent || '--'),
    'Régimen Fiscal: ' + (document.getElementById('previewRegimenFiscal')?.textContent || '--'),
    'Uso CFDI: ' + (document.getElementById('previewUsoCFDI')?.textContent || '--'),
    'Folio: ' + document.getElementById('previewFolio').textContent,
    'Forma de pago: ' + document.getElementById('previewPago').textContent,
    '',
    'Conceptos:',
    ...Array.from(document.querySelectorAll('#invoiceItems tr')).map((row) => row.innerText.replace(/\s+/g, ' ').trim()),
    '',
    'Subtotal: ' + document.getElementById('subtotal').textContent,
    'IVA: ' + document.getElementById('iva').textContent,
    'Descuento: ' + document.getElementById('discountValue').textContent,
    'Total: ' + document.getElementById('total').textContent,
    '',
    'Observaciones: ' + document.getElementById('previewObservaciones').textContent
  ].join('\n');

  if (window.jspdf && window.html2canvas) {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const canvas = await window.html2canvas(document.getElementById('invoicePreview'), { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoiceTitle.replace(/\s+/g, '-').toLowerCase() || 'factura-huesped'}.pdf`);
      return;
    } catch (error) {
      console.warn('No se pudo generar PDF automático, se usará impresión.', error);
    }
  }

  const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'factura-simulada.txt';
  link.click();
  URL.revokeObjectURL(url);
});

window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  invoiceDateEl.textContent = `Fecha: ${today}`;
});
