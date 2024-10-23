import SeriesCategory from '#models/categoria_serie';
import axios from 'axios';
import type { HttpContext } from '@adonisjs/core/http';

export default class CategoriaSerieControladorsController {
  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/detalle_series', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const seriesCategorias = await SeriesCategory.all();

      return response.json({ local: seriesCategorias, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['serieId', 'categoriaId']);
    const seriesCategoria = await SeriesCategory.create(data);

    try {
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

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/detalle_series/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const seriesCategoria = await SeriesCategory.findOrFail(params.id);

      return response.json({ local: seriesCategoria, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const seriesCategoria = await SeriesCategory.findOrFail(params.id);
    seriesCategoria.merge(request.only(['serieId', 'categoriaId']));
    await seriesCategoria.save();

    try {
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/detalle_series/${params.id}`, request.only(['serieId', 'categoriaId']));
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

  public async destroy({ params, response }: HttpContext) {
    const seriesCategoria = await SeriesCategory.findOrFail(params.id);
    await seriesCategoria.delete();

    try {
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/detalle_series/${params.id}`, {
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
