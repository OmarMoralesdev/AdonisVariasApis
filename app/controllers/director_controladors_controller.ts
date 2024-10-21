import Director from '#models/director';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class DirectorControladorsController {
  private async getToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async makeApiRequest(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const response = await axios({
        method,
        url: `${baseUrl}${endpoint}`, 
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
      fecha_nacimiento: faker.date.past().toISOString().split('T')[0], 
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, directores] = await Promise.all([
        this.makeApiRequest('get', '/api/personas'), 
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
    const actorData = this.generateDirectorData();

    try {
        const apiResponse = await this.makeApiRequest('post', '/api/personas/', actorData); 
        return response.status(201).json({ director, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
}
  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, director] = await Promise.all([
        this.makeApiRequest('get', `/api/personas/${params.id}`), 
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
      const apiResponse = await this.makeApiRequest('put', `/api/personas/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ director, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    await director.delete();

    try {
      await this.makeApiRequest('delete', `/api/personas/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Director eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }
}
