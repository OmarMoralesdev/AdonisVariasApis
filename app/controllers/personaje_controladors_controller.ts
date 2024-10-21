import Character from '#models/personaje';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken
import { Console } from 'console';

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class PersonajeControladorsController {

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
        url: `${baseUrl}${endpoint}`, // Utilizar baseUrl concatenado con el endpoint
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
      descripcion: faker.lorem.paragraph(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', '/api/marcas');
      const personajes = await Character.all();

      return response.json({ local: personajes, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'serie_id', 'actor_id']);
    const personaje = await Character.create(data);
    const actorData = this.generateActorData();
   console.log(data)
    try {
        const apiResponse = await this.makeApiRequest('post', '/api/marcas/', actorData); 
        return response.status(201).json({ personaje, apiResponse });
    } catch (error) {
        return response.status(500).json({ actorData, message: 'Error al enviar actor a la API' });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, personaje] = await Promise.all([
        this.makeApiRequest('get', `/api/marcas/${params.id}`),
        Character.findOrFail(params.id),
      ]);

      return response.json({ local: personaje, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const personaje = await Character.findOrFail(params.id);
    personaje.merge(request.only(['nombre', 'serieId', 'actorId']));
    await personaje.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/marcas/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ personaje, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const personaje = await Character.findOrFail(params.id);
    await personaje.delete();

    try {
      await this.makeApiRequest('delete', `/api/marcas/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Personaje eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeActor() {
    const actorData = this.generateActorData(); // Genera un actor falso

    try {
      await this.makeApiRequest('post', '/api/marcas', actorData); // Solo el endpoint relativo
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
