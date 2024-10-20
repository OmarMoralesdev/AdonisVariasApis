import Actor from '#models/actor'
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import { faker } from '@faker-js/faker'
import ApiToken from '#models/token'

export default class ActorControladorsController {
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

  public async index({ response }: HttpContext) {
    try {
      const [apiData, actores] = await Promise.all([
        this.makeApiRequest('get', 'http://192.168.1.135:8000/api/departamentos/'),
        Actor.all(),
      ]);

      return response.json({ local: actores, external: apiData });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'nacionalidad']);
    
    const actor = await Actor.create(data);
    const actorData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/departamentos/', actorData);
      return response.status(201).json({ actor, apiResponse });
    } catch (error) {
      return response.status(500).json({ actor, message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiData, actor] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/departamentos/${params.id}`),
        Actor.find(params.id),
      ]);

      return response.json({ local: actor, external: apiData });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const actor = await Actor.findOrFail(params.id);
    const fakeActorData = this.generateActorData();
    
    actor.merge({
      nombre: fakeActorData.nombre,
      nacionalidad: request.input('nacionalidad') || faker.address.country(),
    });
    
    await actor.save();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/departamentos/${params.id}`, fakeActorData);
      return response.json({ actor, apiResponse });
    } catch (error) {
      return response.status(500).json({ actor, message: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    try {
        const actor = await Actor.findOrFail(params.id);
        await actor.delete();
        
        const apiResponse = await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/departamentos/${params.id}`);
        
        if (apiResponse.status !== 200) {
            return response.status(apiResponse.status).json({ error: 'Failed to delete from external API' });
        }

        return response.status(204).json(null);
    } catch (error) {
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}
  private generateActorData() {
    return {
      nombre: faker.name.firstName(),
      descripcion: faker.lorem.sentence(),
    };
  }

}
