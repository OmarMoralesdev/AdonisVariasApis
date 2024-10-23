import axios from 'axios';
import { HttpContext } from '@adonisjs/core/http';
import Category from '#models/categoria';
import { faker } from '@faker-js/faker'; 
import ApiToken from '#models/token';
import env from '#start/env'

const baseUrl = env.get('baseUrl');

export default class CategoriaControladorsController {
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

  private generarDatosFalsos() {
    return {
      cantidad: faker.number.int({ min: 1, max: 2 }),
      id_inventario: 1,
      id_venta: 1,
      precio_venta: faker.commerce.price(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
        const apiData = await this.hacerSolicitudApi('get', '/api/detalle_ventas');
        const categorias = await Category.all();

        return response.json({ local: categorias, external: apiData });
    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
}

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre']);
    const categoria = await Category.create(data);
    const datosFalsos = this.generarDatosFalsos();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/detalle_ventas', datosFalsos);
      return response.status(201).json({ categoria, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiData = await this.hacerSolicitudApi('get', `/api/detalle_ventas/${params.id}`);
      const categoria = await Category.find(params.id);
  
      return response.json({ local: categoria, external: apiData });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const categoria = await Category.findOrFail(params.id);
    categoria.merge(request.only(['nombre']));
    await categoria.save();
    const datosFalsos = this.generarDatosFalsos();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/detalle_ventas/${params.id}`, datosFalsos);
      return response.json({ categoria, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const categoria = await Category.findOrFail(params.id);
    await categoria.delete();

    try {
      const apiResponse =  await this.hacerSolicitudApi('delete', `/api/detalle_ventas/${params.id}`);
      return response.status(204).json({ message: 'Categoría eliminada exitosamente' ,apiResponse});
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
