import Character from '#models/personaje';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class PersonajeControladorsController {
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
      nombre: faker.name.firstName(),
      descripcion: faker.lorem.paragraph(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', '/api/marcas');
      const personajes = await Character.all();

      return response.json({ local: personajes, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'serie_id', 'actor_id']);
    const personaje = await Character.create(data);
    const actorData = this.generarDatosFalsosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/marcas/', actorData); 
      return response.status(201).json({ personaje, apiResponse });
    } catch (error) {
      return response.status(500).json({ actorData, message: 'Error al enviar actor a la API' });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/marcas/${params.id}`);
      const personaje = await Character.findOrFail(params.id);
  
      return response.json({ local: personaje, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
  
  public async update({ params, request, response }: HttpContext) {
    const personaje = await Character.findOrFail(params.id);
    personaje.merge(request.only(['nombre', 'serieId', 'actorId']));
    await personaje.save();
    const fakeData = this.generarDatosFalsosActor();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/marcas/${params.id}`, fakeData);
      return response.json({ personaje, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const personaje = await Character.findOrFail(params.id);
    await personaje.delete();

    try {
      const apiResponse =   await this.hacerSolicitudApi('delete', `/api/marcas/${params.id}`);
      return response.status(204).json({ message: 'Personaje eliminado exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeActor() {
    const actorData = this.generarDatosFalsosActor();

    try {
      await this.hacerSolicitudApi('post', '/api/marcas', actorData);
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
