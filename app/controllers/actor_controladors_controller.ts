import Actor from '#models/actor';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class ActorControladorsController {
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
        url: `${baseUrl}${endpoint}`, // Usar el baseUrl concatenado con el endpoint
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
      nombre: faker.name.firstName(),
      descripcion: faker.lorem.sentence(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const [apiResponse, actores] = await Promise.all([
        this.makeApiRequest('get', '/api/departamentos/'), // Solo se pasa el endpoint
        Actor.all(),
      ]);

      return response.json({ local: actores, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'nacionalidad']);
    const actor = await Actor.create(data);
    const actorData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('post', '/api/departamentos/', actorData); 
      return response.status(201).json({ actor, apiResponse });
    } catch (error) {
      return response.status(500).json({ actor, message: 'Error al enviar actor a la API' });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, actor] = await Promise.all([
        this.makeApiRequest('get', `/api/departamentos/${params.id}`),
        Actor.find(params.id),
      ]);

      return response.json({ local: actor, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const actor = await Actor.findOrFail(params.id);
    actor.merge(request.only(['nombre', 'nacionalidad']));
    await actor.save();

    const fakeActorData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/departamentos/${params.id}`, fakeActorData); // Solo se pasa el endpoint
      return response.json({ actor, apiResponse });
    } catch (error) {
      return response.status(500).json({ actor, message: 'Error al actualizar actor en la API' });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    try {
      const actor = await Actor.findOrFail(params.id);
      await actor.delete();

      const apiResponse = await this.makeApiRequest('delete', `/api/departamentos/${params.id}`); 

      return response.status(204).json({ message: 'Actor eliminado exitosamente', apiResponse });
    } catch (error) {
      return response.status(500).json({ error: 'Error al eliminar actor' });
    }
  }
}
