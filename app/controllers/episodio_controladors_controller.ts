import Episode from '#models/episodio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class EpisodioControladorsController {
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
      fecha_ingreso: faker.date.past().toISOString().split('T')[0],
      estatus: faker.helpers.arrayElement(['activo', 'inactivo']),
      id_persona: faker.number.int({ min: 13, max:21  }),
      id_suc: faker.number.int({ min: 1, max: 20 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, episodios] = await Promise.all([
        this.makeApiRequest('get', '/api/empleados'), // Solo el endpoint relativo
        Episode.all(),
      ]);

      return response.json({ local: episodios, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['titulo', 'temporada_id']);
    const episodio = await Episode.create(data);
    const actorData = this.generateActorData();

    try {
        const apiResponse = await this.makeApiRequest('post', '/api/empleados/', actorData); 
        return response.status(201).json({ episodio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }


  

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, episodio] = await Promise.all([
        this.makeApiRequest('get', `/api/empleados/${params.id}`),
        Episode.findOrFail(params.id),
      ]);

      return response.json({ local: episodio, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    episodio.merge(request.only(['titulo', 'temporada_id']));
    await episodio.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/empleados/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ episodio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    await episodio.delete();

    try {
      await this.makeApiRequest('delete', `/api/empleados/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Episodio eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeActorData() {
    const fakeData = this.generateActorData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', '/api/empleados', fakeData); // Solo el endpoint relativo
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
