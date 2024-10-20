import axios from 'axios';
import { HttpContext } from '@adonisjs/core/http';
import Category from '#models/categoria';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class CategoriaControladorsController {
  // Método para obtener todas las categorías y consultar a una API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa sin ID
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/detalle_ventas', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén las categorías locales
      const categorias = await Category.all();

      // Devuelve tanto las categorías locales como los datos de la API externa
      return response.json({ local: categorias, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar una nueva categoría y enviar datos falsos a otra API
  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre']);
    const categoria = await Category.create(data);

    // Generar y enviar datos falsos a la API externa
    const fakeData = {
      cantidad: faker.number.int({ min: 1, max: 100 }),
      id_inventario: faker.number.int({ min: 1, max: 1 }),
      id_venta: faker.number.int({ min: 1, max: 1 }),
      precio_venta: faker.commerce.price(),
    };

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/detalle_ventas', fakeData);
      return response.status(201).json({
        categoria,
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

  // Método para mostrar una categoría específica y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa con el ID
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/detalle_ventas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca la categoría en la base de datos local
      const categoria = await Category.find(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: categoria, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar una categoría y enviar datos falsos a otra API
  public async update({ params, request, response }: HttpContext) {
    const categoria = await Category.findOrFail(params.id);
    categoria.merge(request.only(['nombre']));
    await categoria.save();

    // Generar y enviar datos falsos a la API externa
    const fakeData = {
      nombre: faker.commerce.department(),
    };

    try {
      // Enviar actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/detalle_ventas/${params.id}`, fakeData);
      return response.json({
        categoria,
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

  // Método para eliminar una categoría y enviar datos falsos a la API externa
  public async destroy({ params, response }: HttpContext) {
    const categoria = await Category.findOrFail(params.id);
    await categoria.delete();

    // Generar y enviar datos falsos a la API externa
    const fakeData = {
      nombre: faker.commerce.department(),
    };

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/detalle_ventas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Categoría eliminada exitosamente',
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
}
