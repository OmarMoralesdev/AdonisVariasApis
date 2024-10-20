import Episode from '#models/episodio';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class EpisodioControladorsController {
  private async getToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async makeApiRequest(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data,
      });
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud a la API externa:', error);
      throw new Error('Error al comunicarse con la API externa.');
    }
  }

  private generateActorData() {
    return {
      fecha_ingreso: faker.date.past(),
      estatus: faker.helpers.arrayElement(['activo', 'inactivo']),
      id_persona: faker.number.int({ min: 1, max: 5 }),
      id_sucursal: faker.number.int({ min: 1, max: 3 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, episodios] = await Promise.all([
        this.makeApiRequest('get', 'http://192.168.1.135:8000/api/empleados'),
        Episode.all(),
      ]);

      return response.json({ local: episodios, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['titulo', 'temporadaId']);
    const episodio = await Episode.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeActorData();

    return response.status(201).json(episodio);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, episodio] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/empleados/${params.id}`),
        Episode.findOrFail(params.id),
      ]);

      return response.json({ local: episodio, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    episodio.merge(request.only(['titulo', 'temporadaId']));
    await episodio.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/empleados/${params.id}`, fakeData);
      return response.json({ episodio, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const episodio = await Episode.findOrFail(params.id);
    await episodio.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/empleados/${params.id}`);
      return response.status(204).json({ message: 'Episodio eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeActorData() {
    const fakeData = this.generateActorData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/empleados', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
