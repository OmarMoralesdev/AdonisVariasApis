import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import ApiToken from '#models/token'
import env from '#start/env'
import { loginValidator } from '#validators/auth'

const baseUrl = env.get('baseUrl')

export default class AuthController {
  async loginJWT({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)

    const tokenInterno = await auth.use('jwt').generate(user)

    return response.ok({
      tokenInterno: tokenInterno,
    })
  }

  async registrarJWT({ request, response }: HttpContext) {
    const { fullName, email, password } = request.all()

    const user = await User.create({ fullName, email, password })

    return response.created(user)
  }
  async login3(ctx: HttpContext) {
    const { request, response, auth } = ctx;
    const email = request.input('email')
    const password = request.input('password')


    const user = await User.verifyCredentials(email, password);
    const tokenInterno = await auth.use('jwt').generate(user);

    const dan = {
        email: email,
        password: password,
    };

    try {
        const api2Response = await axios.post(`${baseUrl}/api/login`, dan, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const tokenApi2 = api2Response.data.token;
          
        if (tokenApi2) {
            await ApiToken.create({
                token: tokenApi2,
                api_name: 'API 3',
            });
        }
        return response.ok({
            tokenInterno: tokenInterno,
            tokenApi3: tokenApi2,
        });
    } catch (error) {
        console.error('Error en la segunda API:', error.message);

        return response.status(500).json({
            error: 'Login a la otra api fallo',
            details: error.response ? error.response.data : error.message,
        });
    }
}
  async login(ctx: HttpContext) {
    const { request, response, auth } = ctx
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    const tokenInterno = await auth.use('jwt').generate(user)

    const dan = {
      email: email,
      password: password,
    }

    try {
      const api2Response = await axios.post(`${baseUrl}/api/login`, dan, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const tokenApi2 = api2Response.data.token

      if (tokenApi2) {
        await ApiToken.create({
          token: tokenApi2,
          api_name: 'API 3',
        })
      }

      return response.ok({
        tokenInterno: tokenInterno,
        tokenApi3: tokenApi2,
      })
    } catch (error) {
      console.error('Error en la tercera API:', error.message)

      return response.status(500).json({
        error: 'Login to external API failed',
        details: error.response ? error.response.data : error.message,
      })
    }
  }

  async registrar({ request, response }: HttpContext) {
    const fullName = request.input('fullName')
    const email = request.input('email')
    const password = request.input('password')
    const name = request.input('fullName')

    const datos = { fullName, email, password }
    const enviardatos = { name, email, password }

    const user = await User.create(datos)

    try {
      const apiResponse = await axios.post(`${baseUrl}/api/registrar`, enviardatos)
      return response.created({ user, apiResponse: apiResponse.data })
    } catch (error) {
      return response.status(500).send({ error: 'Fallo' })
    }
  }
}
