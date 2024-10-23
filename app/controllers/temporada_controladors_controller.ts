import Season from '#models/temporada';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class TemporadaControladorsController {
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

  private generarDatosFalsosActor() {
    return {
      contacto: faker.phone.number({ style: 'national' }),
      id_persona: 1,
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', '/api/proveedores'); 
      const temporadas = await Season.all();

      return response.json({ local: temporadas, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['numero', 'serie_id']);
    const temporada = await Season.create(data);

    const actorData = this.generarDatosFalsosActor();
    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/proveedores/', actorData); 
      return response.status(201).json({ temporada, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/proveedores/${params.id}`);
      const temporada = await Season.findOrFail(params.id);
  
      return response.json({ local: temporada, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    temporada.merge(request.only(['numero', 'serie_id']));
    await temporada.save();
    const fakeData = this.generarDatosFalsosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/proveedores/${params.id}`, fakeData);
      return response.json({ temporada, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al actualizar datos en la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    await temporada.delete();

    try {
      const apiResponse = await this.hacerSolicitudApi('delete', `/api/proveedores/${params.id}`); 
      return response.status(204).json({ message: 'Temporada eliminada exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async enviarDatosFalsosActor() {
    const actorData = this.generarDatosFalsosActor();

    try {
      await this.hacerSolicitudApi('post', '/api/proveedores', actorData); 
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
