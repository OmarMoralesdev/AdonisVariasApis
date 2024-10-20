import MemorableScene from '#models/escena_memorable';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class EscenaMemorableControladorsController {
  // Método para obtener todas las escenas memorables y consultar a la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/productos', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén las escenas memorables locales
      const escenasMemorables = await MemorableScene.all();

      // Devuelve tanto las escenas memorables locales como los datos de la API externa
      return response.json({ local: escenasMemorables, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar una nueva escena memorable y enviar datos falsos a la API externa
  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['descripcion', 'episodioId']);
    const escenaMemorable = await MemorableScene.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeSceneData(ctx);

    return response.status(201).json(escenaMemorable);
  }

  // Método para mostrar una escena memorable específica y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/productos/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca la escena memorable en la base de datos local
      const escenaMemorable = await MemorableScene.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: escenaMemorable, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar una escena memorable y enviar datos a la API externa
  public async update({ params, request, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    escenaMemorable.merge(request.only(['descripcion', 'episodioId']));
    await escenaMemorable.save();

    try {
      // Enviar actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/productos/${params.id}`, request.only(['descripcion', 'episodioId']));
      return response.json({
        escenaMemorable,
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al enviar datos a la API:', error);
      return response.status(500).json({
        message: 'Error al enviar datos a la API',
        error: error.message,
      });
    }
  }

  // Método para eliminar una escena memorable y enviar datos a la API externa
  public async destroy({ params, response }: HttpContext) {
    const escenaMemorable = await MemorableScene.findOrFail(params.id);
    await escenaMemorable.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/productos/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Escena memorable eliminada exitosamente',
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

  // Método privado para generar datos falsos de la escena memorable
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

  // Método para enviar datos falsos a la API externa
  public async sendFakeSceneData(ctx: HttpContext) {
    const fakeData = this.generateFakeSceneData(); // Genera datos falsos

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/productos', fakeData, {
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
