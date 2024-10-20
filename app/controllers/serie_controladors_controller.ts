import Series from '#models/serie';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class SerieControladorsController {
  // Obtener todas las series y consultar la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/sucursales', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén la lista de series locales
      const seriesList = await Series.all();

      // Devuelve tanto las series locales como los datos de la API externa
      return response.json({ local: seriesList, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Crear una nueva serie y enviar datos falsos a la API externa
  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'descripcion', 'anio']);
    const serie = await Series.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.generateFakeActor(ctx);

    return response.status(201).json(serie);
  }

  // Obtener una serie por ID y consultar la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/sucursales/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca la serie en la base de datos local
      const serie = await Series.findOrFail(params.id);

      // Devuelve los datos locales y los datos de la API externa
      return response.json({ local: serie, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Actualizar una serie existente y enviar la actualización a la API externa
  public async update({ params, request, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    serie.merge(request.only(['nombre', 'descripcion', 'anio']));
    await serie.save();

    try {
      // Enviar la actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/sucursales/${params.id}`, request.only(['nombre', 'descripcion', 'anio']));

      return response.json({
        serie,
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

  // Eliminar una serie y notificar a la API externa
  public async destroy({ params, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    await serie.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/sucursales/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Serie eliminada exitosamente',
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

  // Método privado para generar datos falsos de un actor
  private generateActorData() {
    return {
      nombre: faker.company.name(),
      direccion: faker.address.streetAddress(),
    };
  }

  // Método para enviar datos falsos de actores a la API externa
  public async generateFakeActor({ response }: HttpContext) {
    const actorData = this.generateActorData();

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/sucursales', actorData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(201).json(apiResponse.data);
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
      return response.status(500).json({ message: 'Error al enviar actor a la API' });
    }
  }
}
