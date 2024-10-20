import axios from 'axios';
import User from '#models/user'; // Importa tu modelo de usuario
import type { HttpContext } from '@adonisjs/core/http';
import { loginValidator } from '#validators/auth'; // Asegúrate de tener un validador para el login

export default class AuthController {
  async login({ request, response, auth }: HttpContext) {
    // Validar las credenciales
    const { email, password } = await request.validateUsing(loginValidator);

    try {
      const apiResponse = await axios.post('http://192.168.1.3:800/api/jwt-login', {
        email,
        password
      });

      if (apiResponse.data.token) {

        const user = new User(); 
        user.email = email; 
        const tokenInterno = await auth.use('jwt').generate(user);

        // Verificar si el tokenInterno es un objeto válido
        if (typeof tokenInterno !== 'object' || !('token' in tokenInterno)) {
          return response.status(500).json({
            message: 'Error al generar el token',
          });
        }
        
        return response.ok({
          token: tokenInterno.token, // Accede a token de manera segura
          message: 'Autenticación exitosa',
        });
      }
    } catch (error) {
      // Manejo de errores, puede ser un error de red o la API externa
      return response.status(500).json({
        message: 'Error al autenticar con la API externa',
        error: error.response ? error.response.data : error.message,
      });
    }
  }

  // Método para validar el token (opcional)
  public async validateToken({ request, response, auth }: HttpContext) {
    const token = request.header('Authorization');

    if (!token) {
      return response.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
      // Verifica el token usando el guard de JWT
      await auth.use('jwt').check();
      const user = auth.user;

      return response.json({
        success: true,
        user: user,
      });
    } catch (error) {
      return response.status(401).json({
        success: false,
        error: 'Token inválido',
      });
    }
  }
}
