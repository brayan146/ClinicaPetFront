export function parseValidationErrors(err: any): string {
  const errorObj = err?.error;
  if (!errorObj) {
    return 'Ocurrió un error inesperado de red o conexión con el servidor.';
  }

  let details = '';

  // 1. Si hay un array de errores (como [{"campo":"", "error":"..."}])
  if (Array.isArray(errorObj.errors)) {
    details = errorObj.errors
      .map((e: any) => e.error || e.message || JSON.stringify(e))
      .join('\n');
  } 
  // 2. Si es un diccionario/objeto de errores (como {"Celular": ["..."]})
  else if (errorObj.errors && typeof errorObj.errors === 'object') {
    const list: string[] = [];
    for (const key of Object.keys(errorObj.errors)) {
      const messages = errorObj.errors[key];
      if (Array.isArray(messages)) {
        list.push(...messages);
      } else if (typeof messages === 'string') {
        list.push(messages);
      }
    }
    details = list.join('\n');
  }

  // 3. Fallback al mensaje principal
  if (!details) {
    details = errorObj.message || 'Error de validación en el servidor.';
  }

  return details;
}
