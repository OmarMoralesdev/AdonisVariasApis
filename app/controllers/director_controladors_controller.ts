import Director from '#models/director';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';
import env from '#start/env'

const baseUrl = env.get('baseUrl');

export default class DirectorControladorsController {
  private async obtenerToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async hacerSolicitudApi(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, datos?: any) {
    const token = await this.obtenerToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const respuesta = await axios({
        method,
        url: `${baseUrl}${endpoint}`, 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: datos,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error en la solicitud a la API externa:', error);
      throw new Error('Error al comunicarse con la API externa.');
    }
  }

  private generarDatosDirector() {
    return {
      nombres: faker.name.firstName(),
      apellidos: faker.name.lastName(),
      fecha_nacimiento: faker.date.past().toISOString().split('T')[0], 
    };
  }

  public async index({ response }: HttpContext) {
    try {
        const respuestaApi = await this.hacerSolicitudApi('get', '/api/personas');
        const directores = await Director.all();

        return response.json({ local: directores, external: respuestaApi });
    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
}

  public async store({ request, response }: HttpContext) {
    const datos = request.only(['nombre', 'nacionalidad']);
    const director = await Director.create(datos);
    const datosDirector = this.generarDatosDirector();
    try {
        const respuestaApi = await this.hacerSolicitudApi('post', '/api/personas/', datosDirector); 
        return response.status(201).json({ director, respuestaApi });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const respuestaApi = await this.hacerSolicitudApi('get', `/api/personas/${params.id}`);
      const director = await Director.findOrFail(params.id);
  
      return response.json({ local: director, external: respuestaApi });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
  
  public async update({ params, request, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    director.merge(request.only(['nombre', 'nacionalidad']));
    await director.save();
    const datosFalsos = this.generarDatosDirector();

    try {
      const respuestaApi = await this.hacerSolicitudApi('put', `/api/personas/${params.id}`, datosFalsos);
      return response.json({ director, respuestaApi });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    await director.delete();

    try {
      const respuestaApi = await this.hacerSolicitudApi('delete', `/api/personas/${params.id}`);
      return response.status(204).json({ message: 'Director eliminado exitosamente', respuestaApi });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }
}
