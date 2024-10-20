import axios from 'axios';
import { HttpContext } from '@adonisjs/core/http';
import Category from '#models/categoria';
import { faker } from '@faker-js/faker'; 
import ApiToken from '#models/token';

export default class CategoriaControladorsController {
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

  private generateFakeData() {
    return {
      cantidad: faker.number.int({ min: 1, max: 100 }),
      id_inventario: faker.number.int({ min: 1, max: 1 }),
      id_venta: faker.number.int({ min: 1, max: 1 }),
      precio_venta: faker.commerce.price(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiData, categorias] = await Promise.all([
        this.makeApiRequest('get', 'http://192.168.1.135:8000/api/detalle_ventas'),
        Category.all(),
      ]);

      return response.json({ local: categorias, external: apiData });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre']);
    const categoria = await Category.create(data);
    const fakeData = this.generateFakeData();

    try {
      const apiResponse = await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/detalle_ventas', fakeData);
      return response.status(201).json({ categoria, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiData, categoria] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/detalle_ventas/${params.id}`),
        Category.find(params.id),
      ]);

      return response.json({ local: categoria, external: apiData });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const categoria = await Category.findOrFail(params.id);
    categoria.merge(request.only(['nombre']));
    await categoria.save();
    const fakeData = this.generateFakeData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/detalle_ventas/${params.id}`, fakeData);
      return response.json({ categoria, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const categoria = await Category.findOrFail(params.id);
    await categoria.delete();

    try {
      const apiResponse = await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/detalle_ventas/${params.id}`);
      return response.status(204).json({ message: 'Categoría eliminada exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
  
  public async restore({ params, response }: HttpContext) {
    const categoria = await Category.withTrashed().where('id', params.id).first();

    if (!categoria) {
      return response.status(404).json({ message: 'Categoría no encontrada o no eliminada' });
    }

    await categoria.restore();

    return response.json({ message: 'Categoría restaurada con éxito' });
  }
}
