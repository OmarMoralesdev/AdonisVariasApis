import MemorableScene from '#models/escena_memorable';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class EscenaMemorableControladorsController {
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

  private generateFakeSceneData() {
    return {
      nombre: faker.commerce.productName(),
      descripcion: faker.lorem.sentence(),
      precio_compra_u: faker.commerce.price(),
      precio_venta_u: faker.commerce.price(),
      id_departamento: faker.number.int({ min: 13, max: 20 }),
      id_proveedor: faker.number.int({ min: 6, max: 7 }),
      id_marca: faker.number.int({ min: 2, max: 32 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, escenasMemorables] = await Promise.all([
        this.makeApiRequest('get', '/api/productos'), 
        MemorableScene.all(),
      ]);

      return response.json({ local: escenasMemorables, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['descripcion','episodio_id']);
    const serie = await MemorableScene.create(data);

    const actorData = this.generateFakeSceneData();

    try {
        const apiResponse = await this.makeApiRequest('post', '/api/productos/', actorData); 
        return response.status(201).json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
}

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, escenaMemorable] = await Promise.all([
        this.makeApiRequest('get', `/api/productos/${params.id}`), 
        MemorableScene.findOrFail(params.id),
      ]);

      return response.json({ local: escenaMemorable, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    escenaMemorable.merge(request.only(['descripcion', 'episodio_id']));
    await escenaMemorable.save();
    const fakeData = this.generateFakeSceneData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/productos/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ escenaMemorable, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    await escenaMemorable.delete();

    try {
      await this.makeApiRequest('delete', `/api/productos/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Escena memorable eliminada exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

}
