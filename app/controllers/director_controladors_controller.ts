import Director from '#models/director'; // Asegúrate que el modelo se llame "Director"
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class DirectorControladorsController {
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

  private generateDirectorData() {
    return {
      nombres: faker.name.firstName(),
      apellidos: faker.name.lastName(),
      fecha_nacimiento: faker.date.past(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, directores] = await Promise.all([
        this.makeApiRequest('get', 'http://192.168.1.135:8000/api/personas'),
        Director.all(),
      ]);

      return response.json({ local: directores, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'nacionalidad']);
    const director = await Director.create(data);

    await this.generateFakeDirector();

    return response.status(201).json(director);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, director] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/personas/${params.id}`),
        Director.findOrFail(params.id),
      ]);

      return response.json({ local: director, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    director.merge(request.only(['nombre', 'nacionalidad']));
    await director.save();
    const fakeData = this.generateDirectorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/personas/${params.id}`,fakeData);
      return response.json({ director, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    await director.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/personas/${params.id}`);
      return response.status(204).json({ message: 'Director eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeDirector() {
    const directorData = this.generateDirectorData(); 

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/personas', directorData);
    } catch (error) {
      console.error('Error enviando el director a la API:', error);
    }
  }
}
