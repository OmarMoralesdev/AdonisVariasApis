import Series from '#models/serie';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class SerieControladorsController {

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
      nombre: faker.company.name(),
      direccion: faker.address.streetAddress(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', '/api/sucursales'); // Solo el endpoint relativo
      const seriesList = await Series.all();

      return response.json({ local: seriesList, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'descripcion', 'anio', 'director_id']);
    const serie = await Series.create(data);
console.log(data)
    const actorData = this.generateActorData();

    try {
        const apiResponse = await this.makeApiRequest('post', '/api/sucursales/', actorData); 
        return response.status(201).json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
}

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, serie] = await Promise.all([
        this.makeApiRequest('get', `/api/sucursales/${params.id}`),
        Series.findOrFail(params.id),
      ]);

      return response.json({ local: serie, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    serie.merge(request.only(['nombre', 'descripcion', 'anio']));
    await serie.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/sucursales/${params.id}`, fakeData); 
      return response.json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    await serie.delete();

    try {
      await this.makeApiRequest('delete', `/api/sucursales/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Serie eliminada exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeActor() {
    const actorData = this.generateActorData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', '/api/sucursales', actorData); // Solo el endpoint relativo
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
