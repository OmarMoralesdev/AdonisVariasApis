import Series from '#models/serie';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class SerieControladorsController {

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
      nombre: faker.company.name(),
      direccion: faker.address.streetAddress(),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const apiResponse = await this.makeApiRequest('get', 'http://192.168.1.135:8000/api/sucursales');
      const seriesList = await Series.all();

      return response.json({ local: seriesList, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'descripcion', 'anio']);
    const serie = await Series.create(data);

    // Generar y enviar datos falsos de actores a la API externa
    await this.generateFakeActor();

    return response.status(201).json(serie);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, serie] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/sucursales/${params.id}`),
        Series.findOrFail(params.id),
      ]);

      return response.json({ local: serie, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    serie.merge(request.only(['nombre', 'descripcion', 'anio']));
    await serie.save();
    const fakeData = this.generateActorData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/sucursales/${params.id}`, fakeData);
      return response.json({ serie, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API externa', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const serie = await Series.findOrFail(params.id);
    await serie.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/sucursales/${params.id}`);
      return response.status(204).json({ message: 'Serie eliminada exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async generateFakeActor() {
    const actorData = this.generateActorData();

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/sucursales', actorData);
    } catch (error) {
      console.error('Error enviando el actor a la API:', error);
    }
  }
}
