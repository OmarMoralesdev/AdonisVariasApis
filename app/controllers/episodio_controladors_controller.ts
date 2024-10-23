import Episode from '#models/episodio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class EpisodioControladorsController {
  private async obtenerToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async hacerSolicitudApi(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) {
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
        data,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error en la solicitud a la API externa:', error);
      throw new Error('Error al comunicarse con la API externa.');
    }
  }

  private generarDatosActor() {
    return {
      fecha_ingreso: faker.date.past().toISOString().split('T')[0],
      estatus: faker.helpers.arrayElement(['activo', 'inactivo']),
      id_persona: 1,
      id_suc: 1,
    };
  }

  public async index({ response }: HttpContext) {
    try {
        const apiResponse = await this.hacerSolicitudApi('get', '/api/empleados');
        const episodios = await Episode.all();

        return response.json({ local: episodios, external: apiResponse });
    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
}

  public async store({ request, response }: HttpContext) {
    const data = request.only(['titulo', 'temporada_id']);
    const episodio = await Episode.create(data);
    const actorData = this.generarDatosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/empleados/', actorData); 
      return response.status(201).json({ episodio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/empleados/${params.id}`);
      const episodio = await Episode.findOrFail(params.id);
  
      return response.json({ local: episodio, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
  
  public async update({ params, request, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    episodio.merge(request.only(['titulo', 'temporada_id']));
    await episodio.save();
    const fakeData = this.generarDatosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/empleados/${params.id}`, fakeData); 
      return response.json({ episodio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    await episodio.delete();

    try {
      const apiResponse =await this.hacerSolicitudApi('delete', `/api/empleados/${params.id}`); 
      return response.status(204).json({ message: 'Episodio eliminado exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async enviarDatosFalsosActor() {
    const fakeData = this.generarDatosActor();

    try {
      await this.hacerSolicitudApi('post', '/api/empleados', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
