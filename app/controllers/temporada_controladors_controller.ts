import Season from '#models/temporada';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class TemporadaControladorsController {

  private async getToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async makeApiRequest(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const response = await axios({
        method,
        url: `${baseUrl}${endpoint}`, // Utilizar baseUrl concatenado con el endpoint
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data,
      });
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud a la API externa:', error);
      throw new Error('Error al comunicarse con la API externa.');
    }
  }

  private generateActorData() {
    return {
      contacto: faker.phone.number({style: 'national'}),
      id_persona: faker.number.int({ min: 13, max: 20 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', '/api/proveedores'); 
      const temporadas = await Season.all();

      return response.json({ local: temporadas, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['numero', 'serie_id']);
    const temporada = await Season.create(data);
 
    const actorData = this.generateActorData();
    try {
        const apiResponse = await this.makeApiRequest('post', '/api/proveedores/', actorData); 
        return response.status(201).json({ temporada, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, temporada] = await Promise.all([
        this.makeApiRequest('get', `/api/proveedores/${params.id}`), // Solo el endpoint relativo
        Season.findOrFail(params.id),
      ]);

      return response.json({ local: temporada, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    temporada.merge(request.only(['numero', 'serie_id']));
    await temporada.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/proveedores/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ temporada, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al actualizar datos en la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    await temporada.delete();

    try {
      await this.makeApiRequest('delete', `/api/proveedores/${params.id}`); 
      return response.status(204).json({ message: 'Temporada eliminada exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeActor() {
    const actorData = this.generateActorData();

    try {
      await this.makeApiRequest('post', '/api/proveedores', actorData); 
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
