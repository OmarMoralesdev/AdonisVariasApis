import Season from '#models/temporada';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class TemporadaControladorsController {

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
      contacto: faker.phone.number(),
      id_persona: faker.number.int({ min: 1, max: 5 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', 'http://192.168.1.135:8000/api/proveedores');
      const temporadas = await Season.all();

      return response.json({ local: temporadas, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['numero', 'serieId']);
    const temporada = await Season.create(data);

    // Generar y enviar datos falsos de actores a la API externa
    await this.generateFakeActor();

    return response.status(201).json(temporada);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, temporada] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/proveedores/${params.id}`),
        Season.findOrFail(params.id),
      ]);

      return response.json({ local: temporada, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    temporada.merge(request.only(['numero', 'serieId']));
    await temporada.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/proveedores/${params.id}`, fakeData);
      return response.json({ temporada, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al actualizar datos en la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const temporada = await Season.findOrFail(params.id);
    await temporada.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/proveedores/${params.id}`);
      return response.status(204).json({ message: 'Temporada eliminada exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeActor() {
    const actorData = this.generateActorData();

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/proveedores', actorData);
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
