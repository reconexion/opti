// Utilidad de hash de contraseñas. No hay backend todavía: esto evita
// guardar contraseñas en texto plano en localStorage mientras tanto.
export async function hashPassword(password) {
  const enc = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
