import Award from '#models/premio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class PremioControladorsController {

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

  private generateFakeAwardData() {
    return {
      f_ultimo_stock:  faker.date.past().toISOString().split('T')[0],
      cantidad_producto: faker.number.int({ min: 1, max: 100 }), 
      id_producto: faker.number.int({ min: 3, max: 5 }), 
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', '/api/inventario/');
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
  // Generar y enviar datos falsos de actores a la API externa
  const actorData = this.generateFakeAwardData();

  try {
      const apiResponse = await this.makeApiRequest('post', '/api/inventario/', actorData); 
      return response.status(201).json({ premio, apiResponse });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, premio] = await Promise.all([
        this.makeApiRequest('get', `/api/inventario/${params.id}`), // Solo el endpoint relativo
        Award.findOrFail(params.id),
      ]);

      return response.json({ local: premio, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    premio.merge(request.only(['nombre', 'categoria']));
    await premio.save();
    const fakeData = this.generateFakeAwardData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/inventario/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ premio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    await premio.delete();

    try {
      await this.makeApiRequest('delete', `/api/inventario/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Premio eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeAwardData() {
    const fakeData = this.generateFakeAwardData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', '/api/inventario', fakeData); // Solo el endpoint relativo
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
