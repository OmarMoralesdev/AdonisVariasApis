import SeriesCategory from '#models/categoria_serie';
import axios from 'axios'; // Importa axios
import type { HttpContext } from '@adonisjs/core/http';

export default class CategoriaSerieControladorsController {
  // Método para obtener todas las categorías de series y consultar a la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/detalle_series', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén las categorías de series locales
      const seriesCategorias = await SeriesCategory.all();

      // Devuelve tanto las categorías locales como los datos de la API externa
      return response.json({ local: seriesCategorias, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar una nueva categoría de serie y enviar datos a una API externa
  public async store({ request, response }: HttpContext) {
    const data = request.only(['serieId', 'categoriaId']);
    const seriesCategoria = await SeriesCategory.create(data);

    try {
      // Enviar datos a la API externa
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/detalle_series', data);
      return response.status(201).json({
        seriesCategoria,
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

  // Método para mostrar una categoría de serie específica y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.253.33:8000/api/detalle_series/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca la categoría de serie en la base de datos local
      const seriesCategoria = await SeriesCategory.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: seriesCategoria, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar una categoría de serie y enviar datos a una API externa
  public async update({ params, request, response }: HttpContext) {
    const seriesCategoria = await SeriesCategory.findOrFail(params.id);
    seriesCategoria.merge(request.only(['serieId', 'categoriaId']));
    await seriesCategoria.save();

    try {
      // Enviar actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.253.33:8000/api/detalle_series/${params.id}`, request.only(['serieId', 'categoriaId']));
      return response.json({
        seriesCategoria,
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

  // Método para eliminar una categoría de serie y enviar datos a una API externa
  public async destroy({ params, response }: HttpContext) {
    const seriesCategoria = await SeriesCategory.findOrFail(params.id);
    await seriesCategoria.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.253.33:8000/api/detalle_series/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Categoría de serie eliminada exitosamente',
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
