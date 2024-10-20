import MemorableScene from '#models/escena_memorable';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class EscenaMemorableControladorsController {
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

  private generateFakeSceneData() {
    return {
      nombre: faker.commerce.productName(),
      descripcion: faker.lorem.sentence(),
      precio_compra_u: faker.commerce.price(),
      precio_venta_u: faker.commerce.price(),
      id_departamento: faker.number.int({ min: 1, max: 3 }),
      id_proveedor: faker.number.int({ min: 1, max: 3 }),
      id_marca: faker.number.int({ min: 1, max: 5 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, escenasMemorables] = await Promise.all([
        this.makeApiRequest('get', 'http://192.168.1.135:8000/api/productos'),
        MemorableScene.all(),
      ]);

      return response.json({ local: escenasMemorables, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['descripcion', 'episodioId']);
    const escenaMemorable = await MemorableScene.create(data);

    await this.sendFakeSceneData();

    return response.status(201).json(escenaMemorable);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, escenaMemorable] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/productos/${params.id}`),
        MemorableScene.findOrFail(params.id),
      ]);

      return response.json({ local: escenaMemorable, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    escenaMemorable.merge(request.only(['descripcion', 'episodioId']));
    await escenaMemorable.save();
    const fakeData = this.generateFakeSceneData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/productos/${params.id}`,fakeData);
      return response.json({ escenaMemorable, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    await escenaMemorable.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/productos/${params.id}`);
      return response.status(204).json({ message: 'Escena memorable eliminada exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeSceneData() {
    const fakeData = this.generateFakeSceneData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/productos', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
