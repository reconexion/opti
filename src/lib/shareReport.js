// Enlace para compartir el reporte por WhatsApp sin backend: se apoya en
// el propio WhatsApp del dispositivo (wa.me), en vez de enviar algo desde
// un servidor que todavía no existe.

function soloDigitos(texto = '') {
  return texto.replace(/\D/g, '')
}

function numeroWhatsApp(telefono) {
  const digitos = soloDigitos(telefono)
  if (!digitos) return ''
  // Números mexicanos capturados a 10 dígitos: se antepone el código de país.
  if (digitos.length === 10) return `52${digitos}`
  return digitos
}

export function buildWhatsAppUrl(patient, resumenTexto) {
  const numero = numeroWhatsApp(patient?.telefono)
  return `https://wa.me/${numero}?text=${encodeURIComponent(resumenTexto)}`
}
