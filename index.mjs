import { handler as astroHandler } from './dist/server/entry.mjs';

export const handler = async (event, context) => {
  console.log('Evento recibido:', event); // Log para depuración

  try {
    // Pasamos el evento directamente a AstroJS
    const response = await astroHandler(event, context);

    // Retornamos la respuesta en el formato esperado por Lambda Proxy
    return {
      statusCode: 200, // El código de estado HTTP
      headers: {
        'Content-Type': 'text/html', // El tipo de contenido
        'Access-Control-Allow-Origin': '*', // Permite acceso desde cualquier origen (CORS)
      },
      body: response.body, // El contenido generado por AstroJS (HTML o JSON)
    };
  } catch (error) {
    console.error('Error en SSR:', error);
    return {
      statusCode: 500,
      body: 'Error interno del servidor',
    };
  }
};

