import Season from '#models/temporada';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; 

export default class TemporadaControladorsController {
  // Obtener todas las temporadas y consultar la API externa
  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/proveedores', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtener todas las temporadas locales
      const temporadas = await Season.all();

      // Devolver temporadas locales y externas
      return response.json({ local: temporadas, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Crear una nueva temporada y enviar datos falsos a la API externa
  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['numero', 'serieId']);
    const temporada = await Season.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.generateFakeActor(ctx);

    return response.status(201).json(temporada);
  }

  // Obtener una temporada por ID y consultar la API externa
  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/proveedores/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const temporada = await Season.findOrFail(params.id);

      return response.json({ local: temporada, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Actualizar una temporada existente y sincronizar con la API externa
  public async update({ params, request, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    temporada.merge(request.only(['numero', 'serieId']));
    await temporada.save();

    try {
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/proveedores/${params.id}`, request.only(['numero', 'serieId']));

      return response.json({
        temporada,
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al actualizar datos en la API externa:', error);
      return response.status(500).json({ message: 'Error al actualizar datos en la API externa' });
    }
  }

  // Eliminar una temporada y notificar a la API externa
  public async destroy({ params, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    await temporada.delete();

    try {
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/proveedores/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Temporada eliminada exitosamente',
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al eliminar datos en la API externa:', error);
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa' });
    }
  }

  // Método privado para generar datos falsos de un actor
  private generateActorData() {
    return {
      contacto: faker.phone.number(),
      id_persona: faker.number.int({ min: 1, max: 5 }),
    };
  }

  // Método para enviar datos falsos de actores a la API externa
  public async generateFakeActor({ response }: HttpContext) {
    const actorData = this.generateActorData();

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/proveedores', actorData, {
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
