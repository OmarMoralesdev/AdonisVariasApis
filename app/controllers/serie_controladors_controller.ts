import Series from '#models/serie';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class SerieControladorsController {
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
      nombre: faker.company.name(),
      direccion: faker.address.streetAddress(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', '/api/sucursales');
      const seriesList = await Series.all();

      return response.json({ local: seriesList, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'descripcion', 'anio', 'director_id']);
    const serie = await Series.create(data);
    const actorData = this.generarDatosFalsosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/sucursales/', actorData);
      return response.status(201).json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/sucursales/${params.id}`);
      const serie = await Series.findOrFail(params.id);
  
      return response.json({ local: serie, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
  
  public async update({ params, request, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    serie.merge(request.only(['nombre', 'descripcion', 'anio']));
    await serie.save();
    const fakeData = this.generarDatosFalsosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/sucursales/${params.id}`, fakeData);
      return response.json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    await serie.delete();

    try {
      const apiResponse = await this.hacerSolicitudApi('delete', `/api/sucursales/${params.id}`);
      return response.status(204).json({ message: 'Serie eliminada exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async enviarDatosFalsosActor() {
    const actorData = this.generarDatosFalsosActor();

    try {
      await this.hacerSolicitudApi('post', '/api/sucursales', actorData);
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
