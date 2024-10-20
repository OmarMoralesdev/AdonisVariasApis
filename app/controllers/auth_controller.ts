import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'; // Importa axios
import ApiToken from '#models/token' 
export default class AuthController {
  async login({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)

    const tokenInterno = await auth.use('jwt').generate(user)
  
    return response.ok({
      tokenInterno: tokenInterno,
    })


  }
  async loginOtraApi(ctx: HttpContext) {

    const { request, response, auth } = ctx;
  
    // Validar las credenciales del usuario
    const { email, password } = await request.validateUsing(loginValidator);
  
    // Verificar las credenciales del usuario
    const user = await User.verifyCredentials(email, password);
  
    // Generar el token interno
    const tokenInterno = await auth.use('jwt').generate(user);
  
    // Responder con el token interno
    // return se movió al final del método para no interrumpir el flujo.
    const dan = {
      email: 'eva001@gmail.com',
      password: 'holapapu',
    };
  
    try {
      // Realizar la petición a la segunda API
      const api2Response = await axios.post('http://192.168.1.135:8000/api/logeo', dan, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  
      // Extraer el token de la respuesta
      const tokenApi2 = api2Response.data.tokenApi3;
  
      // Guarda el token en la base de datos, si existe
      if (tokenApi2) {
        await ApiToken.create({
          token: tokenApi2,
          api_name: "API 3"
        });
      }
  
      // Responder con ambos tokens
      return response.ok({
        tokenInterno: tokenInterno, 
        tokenApi3: tokenApi2,      
      });
  
    } catch (error) {
      console.error('Error en la segunda API:', error.message);
      
      // Manejar el error adecuadamente
      return response.status(500).json({
        error: 'Login to external API failed',
        details: error.response ? error.response.data : error.message,
      });
    }
  }
  

  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create(payload)

    return response.created(user)
  }
 
  async loginporsiacaos({ request, auth, response }: HttpContext) {
    const email = request.header('email') as string;
    const password = request.header('password') as string;

    try {
      const user = await User.verifyCredentials(email, password)
      const token =await auth.use('jwt').generate(user);
      return response.json({ token });
    } catch (error) {
      return response.status(401).json({ error: 'Invalid credentials' });
    }
  }

  async loginami({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password']);
    console.log('Datos enviados:', { email, password });

    try {
      // Enviar solicitud a tu propia API para iniciar sesión
      const apiResponse = await axios.post('http://192.168.1.167:3333/login/', {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const token = apiResponse.data.tokenInterno;

      return response.json({ token });

    } catch (error) {
      console.error('Error:', error.message);
      return response.status(500).json({
        error: 'Login failed',
        details: error.response ? error.response.data : error.message
      });
    }
  }


}
