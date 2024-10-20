import Award from '#models/premio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class PremioControladorsController {

  private async getToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async makeApiRequest(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const response = await axios({
        method,
        url,
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
      f_ultimo_stock: faker.date.past(),
      cantidad_producto: faker.number.int({ min: 1, max: 100 }), 
      id_producto: faker.number.int({ min: 1, max: 5 }), 
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', 'http://192.168.1.135:8000/api/inventario/');
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

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeAwardData();

    return response.status(201).json(premio);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, premio] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/inventario/${params.id}`),
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
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/inventario/${params.id}`, fakeData);
      return response.json({ premio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    await premio.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/inventario/${params.id}`);
      return response.status(204).json({ message: 'Premio eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeAwardData() {
    const fakeData = this.generateFakeAwardData();

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/inventario', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
