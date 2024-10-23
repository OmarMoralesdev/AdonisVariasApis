import Award from '#models/premio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class PremioControladorsController {
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

  private generarDatosFalsosPremio() {
    return {
      f_ultimo_stock: faker.date.past().toISOString().split('T')[0],
      cantidad_producto: faker.number.int({ min: 1, max: 100 }),
      id_producto: 1,
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', '/api/inventario/');
      const premios = await Award.all();

      return response.json({ local: premios, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'categoria']);
    const premio = await Award.create(data);
    const actorData = this.generarDatosFalsosPremio();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/inventario/', actorData); 
      return response.status(201).json({ premio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/inventario/${params.id}`);
      const premio = await Award.findOrFail(params.id);
  
      return response.json({ local: premio, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    premio.merge(request.only(['nombre', 'categoria']));
    await premio.save();
    const fakeData = this.generarDatosFalsosPremio();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/inventario/${params.id}`, fakeData);
      return response.json({ premio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    await premio.delete();

    try {
      const apiResponse =  await this.hacerSolicitudApi('delete', `/api/inventario/${params.id}`);
      return response.status(204).json({ message: 'Premio eliminado exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeAwardData() {
    const fakeData = this.generarDatosFalsosPremio();

    try {
      await this.hacerSolicitudApi('post', '/api/inventario', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
