import Award from '#models/premio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class PremioControladorsController {
  // Método para obtener todos los premios y consultar la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/inventario/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén los premios locales
      const premios = await Award.all();

      // Devuelve tanto los premios locales como los datos de la API externa
      return response.json({ local: premios, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar un nuevo premio y enviar datos falsos a la API externa
  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'categoria']);
    const premio = await Award.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeAwardData(ctx);

    return response.status(201).json(premio);
  }

  // Método para mostrar un premio específico y consultar la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/inventario/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca el premio en la base de datos local
      const premio = await Award.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: premio, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar un premio y enviar datos a la API externa
  public async update({ params, request, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    premio.merge(request.only(['nombre', 'categoria']));
    await premio.save();

    try {
      // Enviar la actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/inventario/${params.id}`, request.only(['nombre', 'categoria']));

      return response.json({
        premio,
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al enviar datos a la API externa:', error);
      return response.status(500).json({
        message: 'Error al enviar datos a la API externa',
        error: error.message,
      });
    }
  }

  // Método para eliminar un premio y enviar la solicitud a la API externa
  public async destroy({ params, response }: HttpContext) {
    const premio = await Award.findOrFail(params.id);
    await premio.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/inventario/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Premio eliminado exitosamente',
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al eliminar datos en la API externa:', error);
      return response.status(500).json({
        message: 'Error al eliminar datos en la API externa',
        error: error.message,
      });
    }
  }

  // Método privado para generar datos falsos del premio
  private generateFakeAwardData() {
    return {
      f_ultimo_stock: faker.date.past(),
      cantidad_producto: faker.number.int({ min: 1, max: 100 }), 
      id_producto: faker.number.int({ min: 1, max: 5 }), 
    };
  }

  // Método para enviar datos falsos a la API externa
  public async sendFakeAwardData(ctx: HttpContext) {
    const fakeData = this.generateFakeAwardData();

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/inventario', fakeData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Devuelve la respuesta de la API
      return ctx.response.status(201).json(apiResponse.data);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
      return ctx.response.status(500).json({ message: 'Error al enviar datos a la API' });
    }
  }
}
