import SpecialEvent from '#models/evento_especial';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token'; // Importa el modelo ApiToken

const baseUrl = 'https://45a0-2806-267-1407-8e80-f980-8893-70dc-ca47.ngrok-free.app';

export default class EventoEspecialControladorsController {

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

  private generateFakeEventData() {
    return {
      fecha_hora: faker.date.past().toISOString().replace('T', ' ').split('.')[0],
       f_pago: faker.helpers.arrayElement(['efectivo', 'debito', 'credito']),
      id_empleado: faker.number.int({ min: 6, max: 7 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
        const [apiResponse, eventosEspeciales] = await Promise.all([
            this.makeApiRequest('get', '/api/ventas'), 
            SpecialEvent.all(),
        ]);

        return response.json({ local: eventosEspeciales, external: apiResponse });
    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
}
  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'fecha']);
    const eventoEspecial = await SpecialEvent.create(data);

    // Generar y enviar datos falsos de actores a la API externa
    const actorData = this.generateFakeEventData();

    try {
        const apiResponse = await this.makeApiRequest('post', '/api/ventas/', actorData); 
        return response.status(201).json({ eventoEspecial, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, eventoEspecial] = await Promise.all([
        this.makeApiRequest('get', `/api/ventas/${params.id}`), 
        SpecialEvent.findOrFail(params.id),
      ]);

      return response.json({ local: eventoEspecial, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    eventoEspecial.merge(request.only(['nombre', 'fecha']));
    await eventoEspecial.save();
    const fakeData = this.generateFakeEventData();

    try {
      const apiResponse = await this.makeApiRequest('put', `/api/ventas/${params.id}`, fakeData); // Solo el endpoint relativo
      return response.json({ eventoEspecial, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    await eventoEspecial.delete();

    try {
      await this.makeApiRequest('delete', `/api/ventas/${params.id}`); // Solo el endpoint relativo
      return response.status(204).json({ message: 'Evento especial eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeEventData() {
    const fakeData = this.generateFakeEventData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', '/api/ventas', fakeData); // Solo el endpoint relativo
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
