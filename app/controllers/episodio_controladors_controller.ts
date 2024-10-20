import Episode from '#models/episodio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class EpisodioControladorsController {
  // Método para obtener todos los episodios y consultar a la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/empleados', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén los episodios locales
      const episodios = await Episode.all();

      // Devuelve tanto los episodios locales como los datos de la API externa
      return response.json({ local: episodios, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar un nuevo episodio y enviar datos falsos a la API externa
  public async store({ request, response }: HttpContext) {
    const data = request.only(['titulo', 'temporadaId']);
    const episodio = await Episode.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeActorData(response);

    return response.status(201).json(episodio);
  }

  // Método para mostrar un episodio específico y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/empleados/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca el episodio en la base de datos local
      const episodio = await Episode.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: episodio, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar un episodio y enviar datos a la API externa
  public async update({ params, request, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    episodio.merge(request.only(['titulo', 'temporadaId']));
    await episodio.save();

    try {
      // Enviar actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/empleados/${params.id}`, request.only(['titulo', 'temporadaId']));
      return response.json({
        episodio,
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

  // Método para eliminar un episodio y enviar datos a la API externa
  public async destroy({ params, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    await episodio.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/empleados/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Episodio eliminado exitosamente',
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

  // Método privado para generar datos falsos
  private generateActorData() {
    return {
      fecha_ingreso: faker.date.past(),
      estatus: faker.helpers.arrayElement(['activo', 'inactivo']),
      id_persona: faker.number.int({ min: 1, max: 5 }),
      id_sucursal: faker.number.int({ min: 1, max: 3 }),
    };
  }

  // Método para enviar datos falsos a la API externa
  public async sendFakeActorData(response: HttpContext['response']) {
    const fakeData = this.generateActorData(); // Genera datos falsos

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/empleados', fakeData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Devuelve la respuesta de la API
      return response.status(201).json(apiResponse.data);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
      return response.status(500).json({ message: 'Error al enviar datos a la API' });
    }
  }
}
