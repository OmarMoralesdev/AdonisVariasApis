import Character from '#models/personaje';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class PersonajeControladorsController {
  // Método para obtener todos los personajes y consultar a la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/marcas', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén los personajes locales
      const personajes = await Character.all();

      // Devuelve tanto los personajes locales como los datos de la API externa
      return response.json({ local: personajes, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar un nuevo personaje y enviar datos falsos a la API externa
  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'serieId', 'actorId']);
    const actor = await Character.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.generateFakeActor(ctx);

    return response.status(201).json(actor);
  }

  // Método para mostrar un personaje específico y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/marcas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca el personaje en la base de datos local
      const personaje = await Character.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: personaje, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar un personaje y enviar los cambios a la API externa
  public async update({ params, request, response }: HttpContext) {
    const personaje = await Character.findOrFail(params.id);
    personaje.merge(request.only(['nombre', 'serieId', 'actorId']));
    await personaje.save();

    try {
      // Enviar la actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/marcas/${params.id}`, request.only(['nombre', 'serieId', 'actorId']));

      return response.json({
        personaje,
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

  // Método para eliminar un personaje y enviar la eliminación a la API externa
  public async destroy({ params, response }: HttpContext) {
    const personaje = await Character.findOrFail(params.id);
    await personaje.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/marcas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Personaje eliminado exitosamente',
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

  // Método privado para generar datos falsos del actor
  private generateActorData() {
    return {
      nombre: faker.name.firstName(),
      descripcion: faker.lorem.paragraph(),
    };
  }

  // Método para enviar datos falsos a la API externa
  public async generateFakeActor(ctx: HttpContext) {
    const actorData = this.generateActorData(); // Genera un actor falso

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/marcas', actorData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Devuelve la respuesta de la API
      return ctx.response.status(201).json(apiResponse.data);
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
      return ctx.response.status(500).json({ message: 'Error al enviar actor a la API' });
    }
  }
}
