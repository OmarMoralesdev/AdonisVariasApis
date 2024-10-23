import MemorableScene from '#models/escena_memorable';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class EscenaMemorableControladorsController {
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

  private generarDatosFalsosEscena() {
    return {
      nombre: faker.commerce.productName(),
      descripcion: faker.lorem.sentence(),
      precio_compra_u: faker.commerce.price(),
      precio_venta_u: faker.commerce.price(),
      id_departamento: 1,
      id_proveedor: 1,
      id_marca: 1,
    };
  }

  public async index({ response }: HttpContext) {
    try {
        const apiResponse = await this.hacerSolicitudApi('get', '/api/productos');
        const escenasMemorables = await MemorableScene.all();

        return response.json({ local: escenasMemorables, external: apiResponse });
    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
}

  public async store({ request, response }: HttpContext) {
    const data = request.only(['descripcion', 'episodio_id']);
    const serie = await MemorableScene.create(data);
    const actorData = this.generarDatosFalsosEscena();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/productos/', actorData); 
      return response.status(201).json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/productos/${params.id}`);
      const escenaMemorable = await MemorableScene.findOrFail(params.id);
  
      return response.json({ local: escenaMemorable, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
  
  public async update({ params, request, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    escenaMemorable.merge(request.only(['descripcion', 'episodio_id']));
    await escenaMemorable.save();
    const fakeData = this.generarDatosFalsosEscena();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/productos/${params.id}`, fakeData); 
      return response.json({ escenaMemorable, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    await escenaMemorable.delete();

    try {
      const apiResponse = await this.hacerSolicitudApi('delete', `/api/productos/${params.id}`); 
      return response.status(204).json({ message: 'Escena memorable eliminada exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }
}
