// Verificar autenticación antes de cargar flujo personalizado
fetch('/api/flujo-usuario')
  .then(res => {
    if (res.status === 401 || res.status === 404) {
      window.location.href = 'login.html';
      throw new Error('No autenticado');
    }
    return res.json();
  })
  .then(data => {
    // ...tu lógica normal de flujo...
  })
  .catch(err => {
    // Opcional: mostrar mensaje de error si no es redirección
    console.error(err);
  });