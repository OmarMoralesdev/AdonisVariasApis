import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'; 
import ApiToken from '#models/token' 


const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';


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
  
    const { email, password } = await request.validateUsing(loginValidator);
  
    const user = await User.verifyCredentials(email, password);
  
    const tokenInterno = await auth.use('jwt').generate(user);
  

    const dan = {
      email: 'eva001@gmail.com',
      password: 'holapapu',
    };
  
    try {
      const api2Response = await axios.post(`${baseUrl}/api/logeo`, dan, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  
      const tokenApi2 = api2Response.data.tokenApi3;
  
      if (tokenApi2) {
        await ApiToken.create({
          token: tokenApi2,
          api_name: "API 3"
        });
      }
  
      return response.ok({
        tokenInterno: tokenInterno, 
        tokenApi3: tokenApi2,      
      });
  
    } catch (error) {
      console.error('Error en la segunda API:', error.message);
      
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
      const apiResponse = await axios.post(`${baseUrl}/api/logeo`, {
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
